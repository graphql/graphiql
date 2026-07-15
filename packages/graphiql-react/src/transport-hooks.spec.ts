'use no memo';

import { describe, it, expect, vi } from 'vitest';
import type {
  Transport,
  TransportRequest,
  TransportResponse,
} from '@graphiql/toolkit';
import { TransportHookRegistry } from './transport-hooks';

function makeTransport(send: Transport['send']): Transport {
  return {
    url: 'https://example.test/graphql',
    method: 'POST',
    supportedMethods: ['POST'],
    send,
  };
}

function makeResponse(
  overrides?: Partial<TransportResponse>,
): TransportResponse {
  return {
    ok: true,
    body: { data: { hello: 'world' } },
    timing: { totalMs: 42 },
    size: {},
    ...overrides,
  };
}

function makeRequest(overrides?: Partial<TransportRequest>): TransportRequest {
  return { query: '{ hello }', ...overrides };
}

/** Consume an AsyncIterable and return all values. */
async function collect(
  iter: AsyncIterable<TransportResponse>,
): Promise<TransportResponse[]> {
  const results: TransportResponse[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

describe('TransportHookRegistry', () => {
  describe('onBeforeSend', () => {
    it('calls registered callbacks before send', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn((req: TransportRequest) => req);
      registry.onBeforeSend(cb);

      const transport = registry.wrap(
        makeTransport(async () => makeResponse()),
      );

      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );
      expect(cb).toHaveBeenCalledOnce();
    });

    it('allows the callback to mutate the request', async () => {
      const registry = new TransportHookRegistry();
      registry.onBeforeSend(req => ({
        ...req,
        headers: { ...req.headers, 'X-Plugin-Header': 'injected' },
      }));

      let capturedRequest: TransportRequest | undefined;
      const transport = registry.wrap(
        makeTransport(async (req: TransportRequest) => {
          capturedRequest = req;
          return makeResponse();
        }),
      );

      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );
      expect(capturedRequest?.headers?.['X-Plugin-Header']).toBe('injected');
    });

    it('supports async callbacks', async () => {
      const registry = new TransportHookRegistry();
      registry.onBeforeSend(async req => {
        await Promise.resolve();
        return { ...req, headers: { 'X-Async': 'yes' } };
      });

      let capturedRequest: TransportRequest | undefined;
      const transport = registry.wrap(
        makeTransport(async (req: TransportRequest) => {
          capturedRequest = req;
          return makeResponse();
        }),
      );

      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );
      expect(capturedRequest?.headers?.['X-Async']).toBe('yes');
    });

    it('chains multiple callbacks in registration order', async () => {
      const order: string[] = [];
      const registry = new TransportHookRegistry();
      registry.onBeforeSend(req => {
        order.push('first');
        return req;
      });
      registry.onBeforeSend(req => {
        order.push('second');
        return req;
      });

      const transport = registry.wrap(
        makeTransport(async () => makeResponse()),
      );
      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );

      expect(order).toEqual(['first', 'second']);
    });

    it('cleanup removes the callback', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn((req: TransportRequest) => req);
      const remove = registry.onBeforeSend(cb);

      remove();

      const transport = registry.wrap(
        makeTransport(async () => makeResponse()),
      );
      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );
      expect(cb).not.toHaveBeenCalled();
    });

    it('cleanup is idempotent', () => {
      const registry = new TransportHookRegistry();
      const remove = registry.onBeforeSend(req => req);
      expect(() => {
        remove();
        remove();
      }).not.toThrow();
    });
  });

  describe('onResponse', () => {
    it('calls registered callbacks after send', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      registry.onResponse(cb);

      const response = makeResponse();
      const transport = registry.wrap(makeTransport(async () => response));

      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );
      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith(response);
    });

    it('cleanup removes the callback', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      const remove = registry.onResponse(cb);
      remove();

      const transport = registry.wrap(
        makeTransport(async () => makeResponse()),
      );
      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('async iterable path (subscriptions)', () => {
    async function* makeIterable(
      responses: TransportResponse[],
    ): AsyncIterable<TransportResponse> {
      for (const r of responses) {
        yield r;
      }
    }

    it('calls onBeforeSend before the stream starts', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn((req: TransportRequest) => req);
      registry.onBeforeSend(cb);

      const transport = registry.wrap(
        makeTransport(() => makeIterable([makeResponse()])),
      );

      const iter = transport.send(
        makeRequest(),
      ) as AsyncIterable<TransportResponse>;
      for await (const _ of iter) {
        /* consume */
      }

      expect(cb).toHaveBeenCalledOnce();
    });

    it('calls onResponse for each emitted chunk', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      registry.onResponse(cb);

      const r1 = makeResponse({ ok: true });
      const r2 = makeResponse({ ok: false });
      const transport = registry.wrap(
        makeTransport(() => makeIterable([r1, r2])),
      );

      const iter = transport.send(
        makeRequest(),
      ) as AsyncIterable<TransportResponse>;
      for await (const _ of iter) {
        /* consume */
      }

      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenNthCalledWith(1, r1);
      expect(cb).toHaveBeenNthCalledWith(2, r2);
    });

    it('return() on an iterator obtained from a single [Symbol.asyncIterator]() call disposes the underlying iterable', async () => {
      // This is the pattern a consumer (e.g. the execution store) must follow:
      // call `[Symbol.asyncIterator]()` exactly once, then drive and dispose
      // that same iterator. `send()` returns a fresh iterable object whose
      // `[Symbol.asyncIterator]()` mints new internal state on every call, so
      // calling it a second time to dispose would tear down an iterator that
      // never actually ran anything.
      let disposed = false;
      async function* underlying() {
        try {
          yield makeResponse();
          yield makeResponse();
        } finally {
          disposed = true;
        }
      }

      const registry = new TransportHookRegistry();
      const transport = registry.wrap(makeTransport(() => underlying()));

      const sendResult = transport.send(
        makeRequest(),
      ) as AsyncIterable<TransportResponse>;
      const iterator = sendResult[Symbol.asyncIterator]();

      const first = await iterator.next();
      expect(first.done).toBe(false);

      await iterator.return?.();

      expect(disposed).toBe(true);
    });

    it('calling [Symbol.asyncIterator]() a second time yields an independent iterator', async () => {
      // Documents the exact pitfall bug 2 is about: a second call does NOT return
      // the same iterator that is actively being driven, so disposing it has
      // no effect on the one actually running.
      async function* underlying() {
        yield makeResponse();
        yield makeResponse();
      }

      const registry = new TransportHookRegistry();
      const transport = registry.wrap(makeTransport(() => underlying()));

      const sendResult = transport.send(
        makeRequest(),
      ) as AsyncIterable<TransportResponse>;
      const driving = sendResult[Symbol.asyncIterator]();
      const fresh = sendResult[Symbol.asyncIterator]();

      expect(fresh).not.toBe(driving);
    });
  });

  describe('onError', () => {
    it('calls registered callbacks when send() rejects (promise path)', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      registry.onError(cb);
      const error = new Error('network down');
      const request = makeRequest();
      const transport = registry.wrap(
        makeTransport(async () => {
          throw error;
        }),
      );

      await expect(
        collect(transport.send(request) as AsyncIterable<TransportResponse>),
      ).rejects.toThrow('network down');

      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith(error, request);
    });

    it('calls registered callbacks when the iterable path rejects mid-stream', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      registry.onError(cb);
      const error = new Error('socket closed');
      async function* boom() {
        yield makeResponse();
        throw error;
      }
      const transport = registry.wrap(makeTransport(() => boom()));

      await expect(
        collect(
          transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
        ),
      ).rejects.toThrow('socket closed');

      expect(cb).toHaveBeenCalledOnce();
    });

    it('fires when an onBeforeSend hook throws', async () => {
      const registry = new TransportHookRegistry();
      const hookError = new Error('bad header');
      registry.onBeforeSend(() => {
        throw hookError;
      });
      const cb = vi.fn();
      registry.onError(cb);
      const transport = registry.wrap(
        makeTransport(async () => makeResponse()),
      );

      await expect(
        collect(
          transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
        ),
      ).rejects.toThrow('bad header');

      expect(cb).toHaveBeenCalledOnce();
    });

    it('does not fire on success', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      registry.onError(cb);
      const transport = registry.wrap(
        makeTransport(async () => makeResponse()),
      );

      await collect(
        transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it('cleanup removes the callback', async () => {
      const registry = new TransportHookRegistry();
      const cb = vi.fn();
      const remove = registry.onError(cb);
      remove();
      const transport = registry.wrap(
        makeTransport(async () => {
          throw new Error('boom');
        }),
      );

      await expect(
        collect(
          transport.send(makeRequest()) as AsyncIterable<TransportResponse>,
        ),
      ).rejects.toThrow('boom');

      expect(cb).not.toHaveBeenCalled();
    });
  });
});
