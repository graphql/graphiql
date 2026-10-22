import { afterEach, describe, expect, it, vi } from 'vitest';
import 'isomorphic-fetch';
import { createTransport } from '../createTransport';
import type { CreateTransportOptions, TransportResponse } from '../types';

const url = 'http://localhost/graphql';
const query = '{ __typename }';
const mutation = 'mutation { update }';
const response = (allow?: string, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers(allow === undefined ? {} : { allow }),
  text: async () => '{"data":{}}',
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(allow?: string, options: Partial<CreateTransportOptions> = {}) {
  const fetch = vi.fn().mockResolvedValue(response(allow));
  const transport = createTransport({
    url,
    fetch,
    enableIncrementalDelivery: false,
    ...options,
  });
  return { transport, fetch };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('HTTP method discovery', () => {
  it('discovers lazily, updates subscribers, and preserves POST when available', async () => {
    const { transport, fetch } = setup('QUERY, POST, GET, QUERY, OPTIONS');
    const listener = vi.fn();
    const unsubscribe = transport.subscribe!(listener);
    expect(fetch).not.toHaveBeenCalled();
    const result = transport.send({ query });
    expect(result).toBeInstanceOf(Promise);
    await result;
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'POST',
    ]);
    expect(fetch.mock.calls[0]).toEqual([
      url,
      expect.objectContaining({ method: 'OPTIONS' }),
    ]);
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
    expect(transport.supportedMethods).toEqual(['GET', 'POST', 'QUERY']);
    expect(listener).toHaveBeenCalledTimes(1);
    transport.setMethod!('QUERY');
    transport.setMethod!('QUERY');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await transport.send({ query });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'POST',
      'QUERY',
    ]);
    transport.setMethod!('GET');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it.each(['GET, QUERY', 'QUERY', 'GET'])(
    'selects an advertised replacement from %s',
    async allow => {
      const { transport, fetch } = setup(allow);
      await transport.send({ query });
      expect(transport.method).toBe(allow.includes('QUERY') ? 'QUERY' : 'GET');
      expect(fetch.mock.calls[1][1].method).toBe(transport.method);
    },
  );

  it('supports an initial QUERY method without a manual capability list', async () => {
    const { transport } = setup('GET, QUERY', { method: 'QUERY' });
    await transport.send({ query });
    expect(transport.method).toBe('QUERY');
  });

  it.each([undefined, 'GET QUERY', 'GET; foo=bar'])(
    'falls back when Allow is unavailable or malformed (%s)',
    async allow => {
      const { transport, fetch } = setup(allow, { method: 'QUERY' });
      await transport.send({ query });
      await transport.send({ query });
      expect(transport.supportedMethods).toEqual(['QUERY']);
      expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
        'OPTIONS',
        'QUERY',
        'QUERY',
      ]);
    },
  );

  it.each(['', 'OPTIONS, HEAD', 'post, query', ', ,'])(
    'does not execute when advertised methods are unusable (%s)',
    async allow => {
      const { transport, fetch } = setup(allow);
      await expect(transport.send({ query })).rejects.toThrow(
        /no supported GraphQL HTTP methods/,
      );
      expect(transport.supportedMethods).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );

  it('accepts optional empty list elements and whitespace in Allow', async () => {
    const { transport } = setup(', GET, ,\tQUERY,');
    await transport.send({ query });
    expect(transport.supportedMethods).toEqual(['GET', 'QUERY']);
  });

  it.each([401, 405, 500])(
    'falls back when OPTIONS is rejected with %s',
    async status => {
      const { transport, fetch } = setup();
      fetch.mockResolvedValueOnce(response('GET', status));
      await transport.send({ query });
      expect(transport.supportedMethods).toEqual(['POST']);
      expect(fetch.mock.calls[1][1].method).toBe('POST');
    },
  );

  it('falls back after a network failure', async () => {
    const { transport, fetch } = setup();
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await transport.send({ query });
    expect(fetch.mock.calls[1][1].method).toBe('POST');
  });

  it('bounds discovery even if a fetch implementation ignores abort', async () => {
    vi.useFakeTimers();
    const { transport, fetch } = setup();
    fetch.mockReturnValueOnce(new Promise(() => {}));
    const result = transport.send({ query });
    await vi.advanceTimersByTimeAsync(2000);
    await result;
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(fetch.mock.calls[1][1].method).toBe('POST');
  });

  it('shares concurrent discovery and normalizes effective authentication headers', async () => {
    const { transport, fetch } = setup(undefined, {
      headers: { Authorization: 'static', 'X-Custom': 'value' },
    });
    const options = deferred<ReturnType<typeof response>>();
    fetch.mockReturnValueOnce(options.promise);
    const first = transport.send({
      query,
      headers: { authorization: 'current' },
    });
    const second = transport.send({
      query,
      headers: { AUTHORIZATION: 'current' },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers).toEqual({
      authorization: 'current',
      'x-custom': 'value',
    });
    options.resolve(response('QUERY'));
    await Promise.all([first, second]);
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'QUERY',
      'QUERY',
    ]);
    expect(fetch.mock.calls[1][1].headers.authorization).toBe('current');
    await transport.send({ query, headers: { authorization: 'new' } });
    expect(fetch.mock.calls[3][1].method).toBe('OPTIONS');
  });

  it('preserves a selected method when a new header context also supports it', async () => {
    const { transport } = setup('GET, POST, QUERY');
    await transport.send({ query });
    transport.setMethod!('QUERY');
    await transport.send({ query, headers: { authorization: 'new' } });
    expect(transport.method).toBe('QUERY');
  });

  it.each([false, true])(
    'captures the method when sending before discovery settles (incremental: %s)',
    async incremental => {
      const { transport, fetch } = setup('GET, POST, QUERY', {
        enableIncrementalDelivery: incremental,
      });
      async function consume(result: ReturnType<typeof transport.send>) {
        if (Symbol.asyncIterator in result) {
          for await (const _ of result) {
            /* consume */
          }
        } else {
          await result;
        }
      }
      await consume(transport.send({ query }));
      transport.setMethod!('QUERY');
      const options = deferred<ReturnType<typeof response>>();
      fetch.mockReturnValueOnce(options.promise);
      const result = transport.send({
        query,
        headers: { authorization: 'new' },
      });
      transport.setMethod!('GET');
      const pending = consume(result);
      options.resolve(response('GET, POST, QUERY'));
      await pending;
      expect(fetch.mock.calls.at(-1)![1].method).toBe('QUERY');
      expect(transport.method).toBe('GET');
    },
  );

  it('isolates failing listeners from discovery, later listeners, and execution', async () => {
    const { transport, fetch } = setup('GET, POST, QUERY');
    const error = new Error('observer failed');
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    transport.subscribe!(() => {
      throw error;
    });
    const listener = vi.fn();
    transport.subscribe!(listener);
    await transport.send({ query });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith(
      'Transport change listener threw:',
      error,
    );
    expect(() => transport.setMethod!('QUERY')).not.toThrow();
    expect(listener).toHaveBeenCalledTimes(2);
    await transport.send({ query });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'POST',
      'QUERY',
    ]);
  });

  it('preserves the configured manual order when POST is absent', async () => {
    const { transport, fetch } = setup(undefined, {
      supportedMethods: ['GET', 'QUERY'],
    });
    expect(transport.method).toBe('GET');
    await transport.send({ query });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual(['GET']);
  });

  it('does not let an older header context overwrite current capabilities', async () => {
    const { transport, fetch } = setup();
    const old = deferred<ReturnType<typeof response>>();
    const current = deferred<ReturnType<typeof response>>();
    fetch.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const first = transport.send({ query, headers: { authorization: 'old' } });
    const second = transport.send({ query, headers: { authorization: 'new' } });
    current.resolve(response('GET'));
    await second;
    old.resolve(response('QUERY'));
    await first;
    expect(transport.supportedMethods).toEqual(['GET']);
    expect(transport.method).toBe('GET');
    expect(fetch.mock.calls.slice(2).map(([, init]) => init.method)).toEqual([
      'GET',
      'QUERY',
    ]);
  });

  it('rechecks a previously unusable endpoint when headers change', async () => {
    const { transport, fetch } = setup('');
    await expect(transport.send({ query })).rejects.toThrow(/no supported/);
    fetch.mockResolvedValue(response('POST'));
    await transport.send({ query, headers: { authorization: 'new' } });
    expect(transport.supportedMethods).toEqual(['POST']);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('cancels one waiting execution without canceling shared discovery', async () => {
    const { transport, fetch } = setup();
    const options = deferred<ReturnType<typeof response>>();
    fetch.mockReturnValueOnce(options.promise);
    const controller = new AbortController();
    const canceled = transport.send({ query, signal: controller.signal });
    const other = transport.send({ query });
    controller.abort();
    await expect(canceled).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    options.resolve(response('QUERY'));
    await other;
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'QUERY',
    ]);
  });

  it('does not discover or execute with an already aborted signal', async () => {
    const { transport, fetch } = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(
      transport.send({ query, signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves incremental AsyncIterable behavior and discovers only when consumed', async () => {
    const { transport, fetch } = setup('QUERY', {
      enableIncrementalDelivery: true,
    });
    const result = transport.send({
      query,
    }) as AsyncIterable<TransportResponse>;
    expect(result[Symbol.asyncIterator]).toBeTypeOf('function');
    expect(fetch).not.toHaveBeenCalled();
    const chunks = [];
    for await (const chunk of result) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(1);
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'QUERY',
    ]);
  });

  it('closing an incremental iterator while discovering prevents execution', async () => {
    const { transport, fetch } = setup('QUERY', {
      enableIncrementalDelivery: true,
    });
    const options = deferred<ReturnType<typeof response>>();
    fetch.mockReturnValueOnce(options.promise);
    const iterator = (
      transport.send({ query }) as AsyncIterable<TransportResponse>
    )[Symbol.asyncIterator]();
    const pending = iterator.next();
    await Promise.all([
      expect(pending).rejects.toMatchObject({ name: 'AbortError' }),
      iterator.return!(),
    ]);
    options.resolve(response('QUERY'));
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('routes mutations only through discovered POST', async () => {
    const { transport, fetch } = setup('POST, QUERY', { method: 'QUERY' });
    await transport.send({ query: mutation });
    expect(fetch.mock.calls[1][1].method).toBe('POST');
    expect(transport.method).toBe('QUERY');
    const safeOnly = setup('QUERY');
    await expect(safeOnly.transport.send({ query: mutation })).rejects.toThrow(
      /mutation.*QUERY/,
    );
    expect(safeOnly.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    'rediscovers capabilities for a mutation after authentication changes (incremental: %s)',
    async incremental => {
      const { transport, fetch } = setup('QUERY', {
        enableIncrementalDelivery: incremental,
      });
      async function execute(authorization: string) {
        const result = transport.send({
          query: mutation,
          headers: { authorization },
        });
        if (Symbol.asyncIterator in result) {
          for await (const _ of result) {
            // Consume the operation to run the incremental transport.
          }
        } else {
          await result;
        }
      }

      await expect(execute('query-only')).rejects.toThrow(/mutation.*QUERY/);
      expect(transport.method).toBe('QUERY');
      expect(transport.supportedMethods).toEqual(['QUERY']);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'OPTIONS',
        headers: { authorization: 'query-only' },
      });

      fetch.mockResolvedValue(response('POST, QUERY'));
      await execute('can-mutate');
      expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
        'OPTIONS',
        'OPTIONS',
        'POST',
      ]);
      expect(fetch.mock.calls[1][1].headers.authorization).toBe('can-mutate');
      expect(fetch.mock.calls[2][1].headers.authorization).toBe('can-mutate');
      expect(JSON.parse(fetch.mock.calls[2][1].body)).toMatchObject({
        query: mutation,
      });
      expect(transport.supportedMethods).toEqual(['POST', 'QUERY']);
      expect(transport.method).toBe('QUERY');
    },
  );

  it('keeps explicit supportedMethods authoritative and validates empty lists', async () => {
    const { transport, fetch } = setup('QUERY', { supportedMethods: ['POST'] });
    await transport.send({ query });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual(['POST']);
    expect(() => transport.setMethod!('QUERY')).toThrow(/not supported/);
    expect(() => setup(undefined, { supportedMethods: [] })).toThrow(
      /at least one/,
    );
  });

  it('does not discover for subscriptions', async () => {
    const { transport, fetch } = setup(undefined, {
      subscriptionClient: {
        async *iterate() {
          yield { data: { tick: 1 } };
        },
      },
    });
    const events = [];
    for await (const event of transport.send({
      query: 'subscription { tick }',
    }) as AsyncIterable<TransportResponse>) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
