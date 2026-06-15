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
  });
});
