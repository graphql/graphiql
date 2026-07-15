import {
  type Mock,
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeEach,
} from 'vitest';
import 'isomorphic-fetch';

import { createTransport } from '../createTransport';
import {
  createSimpleFetcher,
  createWebsocketsFetcherFromClient,
} from '../../create-fetcher/lib';
import type { SubscriptionClient, TransportResponse } from '../types';

// Keep the real HTTP transport helpers; only stub the client-to-fetcher adapter
// so no real socket is required.
vi.mock('../../create-fetcher/lib', async () => {
  const actual = await vi.importActual('../../create-fetcher/lib');
  return {
    ...actual,
    createWebsocketsFetcherFromClient: vi.fn(),
  };
});

const URL = 'http://localhost:3000/graphql';
const QUERY = '{ __typename }';
const SUBSCRIPTION = 'subscription OnTick { tick }';

function mockResponse(
  body: unknown,
  init: { status?: number; statusText?: string; headers?: HeadersInit } = {},
) {
  const status = init.status ?? 200;
  return {
    status,
    statusText: init.statusText ?? 'OK',
    ok: status >= 200 && status < 300,
    headers: new Headers(
      init.headers ?? { 'content-type': 'application/json' },
    ),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

/** A response whose body is not valid JSON, e.g. an HTML error page or a plain-text 401. */
function mockRawResponse(
  raw: string,
  init: { status?: number; statusText?: string; headers?: HeadersInit } = {},
) {
  const status = init.status ?? 500;
  return {
    status,
    statusText: init.statusText ?? 'Internal Server Error',
    ok: status >= 200 && status < 300,
    headers: new Headers(init.headers ?? { 'content-type': 'text/html' }),
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
    text: () => Promise.resolve(raw),
  };
}

function mockFetchWith(
  body: unknown,
  init?: { status?: number; statusText?: string; headers?: HeadersInit },
): typeof fetch {
  return vi
    .fn()
    .mockResolvedValue(mockResponse(body, init)) as unknown as typeof fetch;
}

describe('createTransport — query / mutation', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves a Promise<TransportResponse> with real wire metadata', async () => {
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetchWith(
        { data: { __typename: 'Query' } },
        { status: 200, statusText: 'OK' },
      ),
    });

    const result = transport.send({ query: QUERY });
    expect(result).toBeInstanceOf(Promise);

    const response = (await result) as TransportResponse;
    expect(response).toMatchObject({
      ok: true,
      status: 200,
      statusText: 'OK',
      body: { data: { __typename: 'Query' } },
    });
    expect(response.headers?.['content-type']).toBe('application/json');
    expect(response.timing.totalMs).toBeGreaterThanOrEqual(0);
    expect(response.size.request).toBeGreaterThan(0);
    expect(response.size.response).toBeGreaterThan(0);
  });

  it('prefers the content-length header for response size when present', async () => {
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetchWith(
        { data: {} },
        {
          headers: {
            'content-type': 'application/json',
            'content-length': '42',
          },
        },
      ),
    });
    const response = (await transport.send({
      query: QUERY,
    })) as TransportResponse;
    expect(response.size.response).toBe(42);
  });

  it('sets ok=false when the response body contains errors', async () => {
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetchWith({ data: null, errors: [{ message: 'boom' }] }),
    });
    const response = (await transport.send({
      query: QUERY,
    })) as TransportResponse;
    expect(response.ok).toBe(false);
  });

  it('sets ok=false for a non-2xx status even when the body has no errors', async () => {
    // A 401 with `{ data: null }` and no `errors` array used to be `ok: true`
    // because `ok` only consulted the GraphQL body, colliding with the HTTP
    // meaning of `Response.ok`.
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetchWith(
        { data: null },
        { status: 401, statusText: 'Unauthorized' },
      ),
    });
    const response = (await transport.send({
      query: QUERY,
    })) as TransportResponse;
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });

  it('resolves a TransportResponse carrying the real status when the body is not JSON', async () => {
    // A 500 from a proxy, a plain-text 401, or an empty 204 must never make
    // `send()` reject — the caller needs `status`/`statusText`/`headers`
    // precisely when the body can't be parsed.
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: vi.fn().mockResolvedValue(
        mockRawResponse('<html><body>Bad Gateway</body></html>', {
          status: 502,
          statusText: 'Bad Gateway',
        }),
      ) as unknown as typeof fetch,
    });

    const response = (await transport.send({
      query: QUERY,
    })) as TransportResponse;

    expect(response.ok).toBe(false);
    expect(response.status).toBe(502);
    expect(response.statusText).toBe('Bad Gateway');
    expect(response.body).toMatchObject({
      errors: [{ message: '<html><body>Bad Gateway</body></html>' }],
    });
  });

  it('encodes extensions in the request body for POST', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: { __typename: 'Query' } }));
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetch as unknown as typeof fetch,
    });

    await transport.send({
      query: QUERY,
      extensions: { persistedQuery: { sha256Hash: 'abc' } },
    });

    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(fetchInit.body as string)).toMatchObject({
      extensions: { persistedQuery: { sha256Hash: 'abc' } },
    });
  });

  it('threads an AbortSignal into the underlying fetch call', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: {} })) as unknown as Mock;
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetch as unknown as typeof fetch,
    });
    const controller = new AbortController();

    await transport.send({ query: QUERY, signal: controller.signal });

    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.signal).toBe(controller.signal);
  });
});

describe('createTransport — subscription', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns an AsyncIterable<TransportResponse> with no HTTP envelope', async () => {
    (createWebsocketsFetcherFromClient as Mock).mockReturnValue(() =>
      (async function* () {
        yield { data: { tick: 1 } };
        yield { data: { tick: 2 } };
      })(),
    );

    const transport = createTransport({
      url: URL,
      // Truthy placeholder; the real client never gets called since the
      // adapter above is mocked.
      subscriptionClient: {} as SubscriptionClient,
    });
    const result = transport.send({ query: SUBSCRIPTION });

    expect(
      result !== null &&
        typeof result === 'object' &&
        Symbol.asyncIterator in result,
    ).toBe(true);

    const events: TransportResponse[] = [];
    for await (const event of result as AsyncIterable<TransportResponse>) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ ok: true, body: { data: { tick: 1 } } });
    // No HTTP response envelope for a socket.
    expect(events[0].status).toBeUndefined();
    expect(events[0].headers).toBeUndefined();
    expect(events[0].size.response).toBeGreaterThan(0);
  });

  it('throws when no subscriptionClient is provided', async () => {
    const transport = createTransport({ url: URL });
    const result = transport.send({ query: SUBSCRIPTION });
    await expect(async () => {
      for await (const _ of result as AsyncIterable<TransportResponse>) {
        // drain
      }
    }).rejects.toThrow(/not configured for subscriptions/);
  });
});

describe('createSimpleFetcher (backward-compatible)', () => {
  it('returns the parsed body, unaffected by the new Transport API', async () => {
    const fetcher = createSimpleFetcher(
      { url: URL },
      mockFetchWith({ data: { __typename: 'Query' } }),
    );
    const result = await fetcher({ query: QUERY }, {});
    expect(result).toEqual({ data: { __typename: 'Query' } });
  });
});

const MUTATION = 'mutation DoThing { doThing }';
const QUERY_WITH_VARS = 'query Q($id: ID!) { node(id: $id) { __typename } }';

describe('createTransport — GET method', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: { __typename: 'Query' } }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to POST-only: no setMethod, requests go out as POST', () => {
    const transport = createTransport({
      url: URL,
      fetch: mockFetch as typeof fetch,
    });
    expect(transport.method).toBe('POST');
    expect(transport.supportedMethods).toEqual(['POST']);
    expect(transport.setMethod).toBeUndefined();
  });

  it("GET-only: active method is GET when supportedMethods is ['GET']", () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['GET'],
      fetch: mockFetch as typeof fetch,
    });
    expect(transport.method).toBe('GET');
    expect(transport.supportedMethods).toEqual(['GET']);
    expect(transport.setMethod).toBeUndefined();
  });

  it('GET-only: a query goes out as GET with params in the URL', async () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['GET'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY });

    const [fetchedUrl, fetchInit] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(fetchInit.method).toBe('GET');
    expect(fetchInit.body).toBeUndefined();
    const parsed = new globalThis.URL(fetchedUrl);
    expect(parsed.searchParams.get('query')).toBe(QUERY);
  });

  it('GET-only: a mutation throws a clear error', () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['GET'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    expect(() => transport.send({ query: MUTATION })).toThrow(/mutation.*GET/i);
  });

  it('GET query encodes params in the URL with no request body', async () => {
    const transport = createTransport({
      url: URL,
      method: 'GET',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY });

    const [fetchedUrl, fetchInit] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(fetchInit.method).toBe('GET');
    expect(fetchInit.body).toBeUndefined();
    const parsed = new globalThis.URL(fetchedUrl);
    expect(parsed.searchParams.get('query')).toBe(QUERY);
  });

  it('GET query encodes variables as a JSON string in the URL', async () => {
    const variables = { id: '123' };
    const transport = createTransport({
      url: URL,
      method: 'GET',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY_WITH_VARS, variables });

    const [fetchedUrl] = mockFetch.mock.calls[0] as [string];
    const parsed = new globalThis.URL(fetchedUrl);
    expect(parsed.searchParams.get('variables')).toBe(
      JSON.stringify(variables),
    );
  });

  it('GET query encodes operationName in the URL', async () => {
    const transport = createTransport({
      url: URL,
      method: 'GET',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY_WITH_VARS, operationName: 'Q' });

    const [fetchedUrl] = mockFetch.mock.calls[0] as [string];
    const parsed = new globalThis.URL(fetchedUrl);
    expect(parsed.searchParams.get('operationName')).toBe('Q');
  });

  it('GET query encodes extensions as a JSON string in the URL', async () => {
    const extensions = { persistedQuery: { sha256Hash: 'abc' } };
    const transport = createTransport({
      url: URL,
      method: 'GET',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY_WITH_VARS, extensions });

    const [fetchedUrl] = mockFetch.mock.calls[0] as [string];
    const parsed = new globalThis.URL(fetchedUrl);
    expect(parsed.searchParams.get('extensions')).toBe(
      JSON.stringify(extensions),
    );
  });

  it('GET query omits variables and operationName when absent', async () => {
    const transport = createTransport({
      url: URL,
      method: 'GET',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY });

    const [fetchedUrl] = mockFetch.mock.calls[0] as [string];
    const parsed = new globalThis.URL(fetchedUrl);
    expect(parsed.searchParams.has('variables')).toBe(false);
    expect(parsed.searchParams.has('operationName')).toBe(false);
  });

  it('mutation is sent as POST even when GET is selected (both supported)', async () => {
    const transport = createTransport({
      url: URL,
      method: 'GET',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: MUTATION });

    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.method).toBe('POST');
    expect(typeof fetchInit.body).toBe('string');
    expect(JSON.parse(fetchInit.body as string)).toMatchObject({
      query: MUTATION,
    });
  });

  it('both methods: active method defaults to POST when no method opt is passed', () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['GET', 'POST'],
      fetch: mockFetch as typeof fetch,
    });
    expect(transport.method).toBe('POST');
    expect(transport.setMethod).toBeDefined();
  });

  it('setMethod switches the active method', async () => {
    const transport = createTransport({
      url: URL,
      method: 'POST',
      supportedMethods: ['GET', 'POST'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    expect(transport.method).toBe('POST');
    transport.setMethod?.('GET');
    expect(transport.method).toBe('GET');

    await transport.send({ query: QUERY });
    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.method).toBe('GET');
  });

  it('setMethod throws when asked to switch to an unsupported method', () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['GET', 'POST'],
      fetch: mockFetch as typeof fetch,
    });
    // TypeScript would catch this at compile time; this verifies the runtime guard.
    expect(() => transport.setMethod?.('GET' as never)).not.toThrow();
    // Simulating a value that isn't in supportedMethods by bypassing types.
    expect(() =>
      (transport.setMethod as (m: string) => void)?.('DELETE'),
    ).toThrow(/not supported/i);
  });

  it('throws at construction when method is not in supportedMethods', () => {
    expect(() =>
      createTransport({
        url: URL,
        method: 'GET',
        supportedMethods: ['POST'],
        fetch: mockFetch as typeof fetch,
      }),
    ).toThrow(/not in supportedMethods/i);
  });

  it('POST keeps content-type and accept headers', async () => {
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY });

    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((fetchInit.headers as Record<string, string>)['content-type']).toBe(
      'application/json',
    );
    expect((fetchInit.headers as Record<string, string>).accept).toMatch(
      'application/graphql-response+json',
    );
  });

  it('the default transport (incremental delivery on) still requests the spec media type', async () => {
    // `enableIncrementalDelivery` defaults to true, routing through
    // `multipartHttpTransport`. Its accept header must advertise
    // `application/graphql-response+json` too, not just `multipartHttpTransport`'s
    // own `application/json, multipart/mixed` — otherwise the default transport
    // silently asks spec-compliant servers to fall back to legacy semantics.
    const transport = createTransport({
      url: URL,
      fetch: mockFetch as typeof fetch,
    });

    // Incremental delivery on means `send()` returns an AsyncIterable; drain
    // it to actually trigger the underlying fetch call.
    for await (const _ of transport.send({
      query: QUERY,
    }) as AsyncIterable<unknown>) {
      // consume
    }

    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((fetchInit.headers as Record<string, string>).accept).toMatch(
      'application/graphql-response+json',
    );
  });

  it('the default transport also resolves a TransportResponse when the body is not JSON', async () => {
    // Same non-JSON-body guarantee as the simple path, but through
    // `multipartHttpTransport`'s single-response branch (the default when
    // incremental delivery is on and the server answers without `multipart/mixed`).
    const transport = createTransport({
      url: URL,
      fetch: vi
        .fn()
        .mockResolvedValue(
          mockRawResponse('Unauthorized', { status: 401 }),
        ) as unknown as typeof fetch,
    });

    const result = transport.send({
      query: QUERY,
    }) as AsyncIterable<TransportResponse>;
    const chunk: TransportResponse[] = [];
    for await (const v of result) {
      chunk.push(v);
    }

    expect(chunk).toHaveLength(1);
    expect(chunk[0]).toMatchObject({
      ok: false,
      status: 401,
      body: { errors: [{ message: 'Unauthorized' }] },
    });
  });
});

describe('createTransport — QUERY method', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi
      .fn()
      .mockResolvedValue(mockResponse({ data: { __typename: 'Query' } }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends a query as QUERY with a JSON body (not in the URL)', async () => {
    const transport = createTransport({
      url: URL,
      method: 'QUERY',
      supportedMethods: ['POST', 'QUERY'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: QUERY });

    const [fetchedUrl, fetchInit] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(fetchInit.method).toBe('QUERY');
    expect(fetchedUrl).toBe(URL);
    expect(typeof fetchInit.body).toBe('string');
    expect(JSON.parse(fetchInit.body as string)).toMatchObject({
      query: QUERY,
    });
    expect((fetchInit.headers as Record<string, string>)['content-type']).toBe(
      'application/json',
    );
  });

  it('sends a mutation as POST even when QUERY is selected (both supported)', async () => {
    const transport = createTransport({
      url: URL,
      method: 'QUERY',
      supportedMethods: ['POST', 'QUERY'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    await transport.send({ query: MUTATION });

    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.method).toBe('POST');
    expect(JSON.parse(fetchInit.body as string)).toMatchObject({
      query: MUTATION,
    });
  });

  it('QUERY-only: a mutation throws a clear error naming QUERY', () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['QUERY'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    expect(() => transport.send({ query: MUTATION })).toThrow(
      /mutation.*QUERY/i,
    );
  });

  it('setMethod can switch to QUERY when supported', async () => {
    const transport = createTransport({
      url: URL,
      supportedMethods: ['GET', 'POST', 'QUERY'],
      enableIncrementalDelivery: false,
      fetch: mockFetch as typeof fetch,
    });

    transport.setMethod?.('QUERY');
    expect(transport.method).toBe('QUERY');

    await transport.send({ query: QUERY });
    const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(fetchInit.method).toBe('QUERY');
  });
});
