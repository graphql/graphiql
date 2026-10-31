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
  it('isolates failing observers and notifies a resubscribed listener once per change', async () => {
    const { transport } = setup('GET, POST, QUERY');
    const error = new Error('Observer failure');
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    transport.subscribe!(() => {
      throw error;
    });
    let unsubscribe: () => void;
    const rejoining = vi.fn(() => {
      unsubscribe();
      unsubscribe = transport.subscribe!(rejoining);
    });
    unsubscribe = transport.subscribe!(rejoining);
    const observer = vi.fn(() => transport.method);
    transport.subscribe!(observer);

    await expect(transport.send({ query })).resolves.toMatchObject({
      method: 'QUERY',
    });
    expect(rejoining).toHaveBeenCalledOnce();
    expect(observer).toHaveLastReturnedWith('QUERY');
    expect(logged).toHaveBeenCalledWith(
      'GraphiQL: a transport state listener threw:',
      error,
    );

    transport.setMethod!('GET');
    expect(rejoining).toHaveBeenCalledTimes(2);
    expect(observer).toHaveLastReturnedWith('GET');
  });

  it('notifies subscribers with live discovered methods and overrides', async () => {
    const { transport, fetch } = setup('GET, POST, QUERY');
    const listener = vi.fn(() => ({
      method: transport.method,
      override: transport.methodOverride,
      supportedMethods: transport.supportedMethods,
    }));
    const unsubscribe = transport.subscribe!(listener);
    expect(listener).not.toHaveBeenCalled();
    expect(transport.methodOverride).toBeUndefined();

    await transport.send({ query });
    expect(listener).toHaveLastReturnedWith({
      method: 'QUERY',
      override: undefined,
      supportedMethods: ['GET', 'POST', 'QUERY'],
    });

    transport.setMethod!('GET');
    expect(listener).toHaveLastReturnedWith({
      method: 'GET',
      override: 'GET',
      supportedMethods: ['GET', 'POST', 'QUERY'],
    });
    transport.setMethod!();
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveLastReturnedWith({
      method: 'QUERY',
      override: undefined,
      supportedMethods: ['GET', 'POST', 'QUERY'],
    });

    // Repeating the same selection or discovery result is not a state change.
    const methods = transport.supportedMethods;
    transport.setMethod!();
    await transport.send({ query, headers: { authorization: 'new' } });
    expect(transport.supportedMethods).toBe(methods);
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    fetch.mockResolvedValue(response('POST'));
    await transport.send({ query, headers: { authorization: 'latest' } });
    transport.setMethod!('POST');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(transport.method).toBe('POST');
  });

  it('observes automatic versus explicit selection even when the method is unchanged', () => {
    const { transport } = setup(undefined, {
      method: 'POST',
      supportedMethods: ['POST'],
    });
    const listener = vi.fn();
    transport.subscribe!(listener);
    expect(transport.methodOverride).toBe('POST');
    transport.setMethod!();
    expect(transport.method).toBe('POST');
    expect(transport.methodOverride).toBeUndefined();
    expect(listener).toHaveBeenCalledOnce();
    transport.setMethod!('POST');
    expect(transport.methodOverride).toBe('POST');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('notifies when discovery removes all usable methods before execution fails', async () => {
    const { transport } = setup('OPTIONS, HEAD');
    const listener = vi.fn(() => transport.supportedMethods);
    transport.subscribe!(listener);
    await expect(transport.send({ query })).rejects.toThrow(
      /no supported GraphQL HTTP methods/,
    );
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveLastReturnedWith([]);
  });

  it('discovers lazily and automatically prefers QUERY', async () => {
    const { transport, fetch } = setup('QUERY, POST, GET, QUERY, OPTIONS');
    expect(fetch).not.toHaveBeenCalled();
    const result = transport.send({ query });
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatchObject({ method: 'QUERY' });
    await transport.send({ query });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'QUERY',
      'QUERY',
    ]);
    expect(fetch.mock.calls[0]).toEqual([
      url,
      expect.objectContaining({ method: 'OPTIONS' }),
    ]);
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
    expect(transport.supportedMethods).toEqual(['GET', 'POST', 'QUERY']);
    expect(transport.method).toBe('QUERY');
  });

  it.each([
    ['GET, POST, QUERY', 'QUERY'],
    ['GET, QUERY', 'QUERY'],
    ['GET, POST', 'POST'],
    ['POST', 'POST'],
    ['QUERY', 'QUERY'],
    ['GET', 'GET'],
  ])('automatically selects %s as %s', async (allow, method) => {
    const { transport, fetch } = setup(allow);
    await expect(transport.send({ query })).resolves.toMatchObject({ method });
    expect(transport.method).toBe(method);
    expect(fetch.mock.calls[1][1].method).toBe(method);
  });

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
          for await (const chunk of result) {
            return chunk;
          }
        } else {
          return result;
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
      expect((await pending)?.method).toBe('QUERY');
      expect(fetch.mock.calls.at(-1)![1].method).toBe('QUERY');
      expect(transport.method).toBe('GET');
    },
  );

  it('uses the same automatic preference with explicit supportedMethods', async () => {
    const { transport, fetch } = setup(undefined, {
      supportedMethods: ['GET', 'QUERY'],
    });
    expect(transport.method).toBe('QUERY');
    await transport.send({ query });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual(['QUERY']);
  });

  it('recomputes the automatic method when a new header context supports QUERY', async () => {
    const { transport, fetch } = setup('POST');
    await transport.send({ query });
    fetch.mockResolvedValue(response('GET, POST, QUERY'));
    await expect(
      transport.send({ query, headers: { authorization: 'new' } }),
    ).resolves.toMatchObject({ method: 'QUERY' });
    expect(transport.method).toBe('QUERY');
  });

  it.each([false, true])(
    'rejects an unavailable override without silently changing method (incremental: %s)',
    async incremental => {
      const { transport, fetch } = setup('POST, QUERY', {
        method: 'GET',
        enableIncrementalDelivery: incremental,
      });
      const execute = async () => {
        const result = transport.send({ query });
        if (Symbol.asyncIterator in result) {
          for await (const _ of result) {
            /* consume */
          }
        } else {
          await result;
        }
      };
      await expect(execute()).rejects.toThrow(/GET.*not supported/);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(transport.method).toBe('GET');
      transport.setMethod!();
      await execute();
      expect(fetch.mock.calls[1][1].method).toBe('QUERY');
      expect(transport.method).toBe('QUERY');
    },
  );

  it('routes mutations through POST even when the query override is unavailable', async () => {
    const { transport, fetch } = setup('POST, QUERY', { method: 'GET' });
    await expect(transport.send({ query: mutation })).resolves.toMatchObject({
      method: 'POST',
    });
    expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual([
      'OPTIONS',
      'POST',
    ]);
    await expect(transport.send({ query })).rejects.toThrow(
      /GET.*not supported/,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('accepts a GET override before discovery and keeps mutations on POST', async () => {
    const { transport, fetch } = setup('GET, POST, QUERY');
    transport.setMethod!('GET');
    const queryWithVariables = 'query Read($id: ID!) { node(id: $id) { id } }';
    await expect(
      transport.send({
        query: queryWithVariables,
        variables: { id: 'hello & goodbye' },
        operationName: 'Read',
        extensions: { trace: 'hello & goodbye' },
      }),
    ).resolves.toMatchObject({ method: 'GET' });
    const [requestUrl, init] = fetch.mock.calls[1];
    expect(init.body).toBeUndefined();
    const params = new URL(requestUrl).searchParams;
    expect(params.get('query')).toBe(queryWithVariables);
    expect(JSON.parse(params.get('variables')!)).toEqual({
      id: 'hello & goodbye',
    });
    expect(params.get('operationName')).toBe('Read');
    expect(JSON.parse(params.get('extensions')!)).toEqual({
      trace: 'hello & goodbye',
    });
    await expect(transport.send({ query: mutation })).resolves.toMatchObject({
      method: 'POST',
    });
    expect(transport.method).toBe('GET');
    transport.setMethod!();
    await expect(transport.send({ query })).resolves.toMatchObject({
      method: 'QUERY',
    });
  });

  it.each([
    { query: 'invalid GraphQL' },
    { query: 'query Read { id } mutation Change { update }' },
    { query, operationName: 'Missing' },
  ])(
    'uses POST when the selected operation cannot be classified: %s',
    async request => {
      const { transport, fetch } = setup('GET, POST, QUERY');
      await expect(transport.send(request)).resolves.toMatchObject({
        method: 'POST',
      });
      expect(fetch.mock.calls[1][1].method).toBe('POST');
      const safeOnly = setup('QUERY');
      await expect(safeOnly.transport.send(request)).rejects.toThrow(
        /unclassified operation.*QUERY/,
      );
      expect(safeOnly.fetch).toHaveBeenCalledTimes(1);
    },
  );

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
    expect(chunks[0].method).toBe('QUERY');
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
    transport.setMethod!('QUERY');
    expect(() => transport.send({ query })).toThrow(/not supported/);
    expect(fetch).toHaveBeenCalledTimes(1);
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
    expect(events[0].method).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
