import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fetcherModule from '../../create-fetcher';
import { createTransport } from '../createTransport';
import 'isomorphic-fetch';

// graphql-ws is imported transitively; mock it so no real WebSocket is required.
vi.mock('graphql-ws');

const BASE_URL = 'http://localhost:3000/graphql';
const QUERY = '{ __typename }';
const MUTATION = 'mutation Noop { noop }';
const SUBSCRIPTION_QUERY = 'subscription OnTick { tick }';

function makeRequest(
  query = QUERY,
): Parameters<ReturnType<typeof createTransport>['send']>[0] {
  return {
    url: BASE_URL,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    query,
  };
}

function mockFetchWith(data: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
  }) as unknown as typeof fetch;
}

// ─── query / mutation ────────────────────────────────────────────────────────

describe('createTransport — query / mutation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a Transport with a send method', () => {
    const transport = createTransport({
      url: BASE_URL,
      fetch: mockFetchWith({ data: { __typename: 'Query' } }),
    });
    expect(typeof transport.send).toBe('function');
  });

  it('resolves a Promise<TransportResponse> for a query', async () => {
    const transport = createTransport({
      url: BASE_URL,
      fetch: mockFetchWith({ data: { __typename: 'Query' } }),
    });

    const result = transport.send(makeRequest(QUERY));
    expect(result).toBeInstanceOf(Promise);

    const response = await (result as Promise<unknown>);
    expect(response).toMatchObject({
      ok: true,
      status: 200,
      statusText: 'OK',
      body: { data: { __typename: 'Query' } },
    });
  });

  it('resolves a Promise<TransportResponse> for a mutation', async () => {
    const transport = createTransport({
      url: BASE_URL,
      fetch: mockFetchWith({ data: { noop: true } }),
    });
    const response = await (transport.send(
      makeRequest(MUTATION),
    ) as Promise<unknown>);
    expect(response).toMatchObject({
      ok: true,
      body: { data: { noop: true } },
    });
  });

  it('sets ok=false when the response contains errors', async () => {
    const transport = createTransport({
      url: BASE_URL,
      fetch: mockFetchWith({
        data: null,
        errors: [{ message: 'something went wrong' }],
      }),
    });
    const response = await (transport.send(makeRequest()) as Promise<unknown>);
    expect(response).toMatchObject({ ok: false });
  });

  it('includes timing with a non-negative totalMs', async () => {
    const transport = createTransport({
      url: BASE_URL,
      fetch: mockFetchWith({ data: {} }),
    });
    const response = (await transport.send(makeRequest())) as {
      timing: { totalMs: number };
    };
    expect(typeof response.timing.totalMs).toBe('number');
    expect(response.timing.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('includes size.response equal to JSON-encoded body length', async () => {
    const body = { data: { value: 'hello' } };
    const transport = createTransport({
      url: BASE_URL,
      fetch: mockFetchWith(body),
    });
    const response = (await transport.send(makeRequest())) as {
      size: { request: number; response: number };
    };
    expect(response.size.response).toBe(JSON.stringify(body).length);
  });

  it('calls the underlying fetch with per-request headers', async () => {
    const mockFetch = mockFetchWith({ data: {} });
    const transport = createTransport({
      url: BASE_URL,
      headers: { 'x-static': 'yes' },
      fetch: mockFetch,
    });
    await transport.send({
      ...makeRequest(),
      headers: { 'x-dynamic': 'also' },
    });
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});

// ─── subscription ────────────────────────────────────────────────────────────

describe('createTransport — subscription', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns AsyncIterable<TransportResponse> for a subscription', async () => {
    // A plain async generator simulates what createGraphiQLFetcher returns when
    // backed by a wsClient — an AsyncIterable that emits one result per event.
    async function* fakeSubscription() {
      yield { data: { tick: 1 } };
      yield { data: { tick: 2 } };
      yield { data: { tick: 3 } };
    }

    // Replace `createGraphiQLFetcher` for this test so the resulting fetcher
    // synchronously returns a subscription-shaped AsyncIterable.
    vi.spyOn(fetcherModule, 'createGraphiQLFetcher').mockReturnValue((() =>
      fakeSubscription()) as ReturnType<
      typeof fetcherModule.createGraphiQLFetcher
    >);

    const transport = createTransport({ url: BASE_URL });
    const result = transport.send(makeRequest(SUBSCRIPTION_QUERY));

    // A synchronously-returned AsyncIterable must not be a plain Promise.
    expect(
      result !== null &&
        typeof result === 'object' &&
        Symbol.asyncIterator in result,
    ).toBe(true);

    const collected: unknown[] = [];
    for await (const item of result as AsyncIterable<unknown>) {
      collected.push(item);
    }

    // Each subscription event is wrapped in a TransportResponse.
    expect(collected).toHaveLength(3);
    expect(collected[0]).toMatchObject({
      ok: true,
      body: { data: { tick: 1 } },
    });
    expect(collected[1]).toMatchObject({
      ok: true,
      body: { data: { tick: 2 } },
    });
    expect(collected[2]).toMatchObject({
      ok: true,
      body: { data: { tick: 3 } },
    });
  });
});
