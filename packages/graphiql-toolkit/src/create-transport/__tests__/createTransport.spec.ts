import { type Mock, describe, it, expect, vi, afterEach } from 'vitest';
import 'isomorphic-fetch';

import { createTransport } from '../createTransport';
import { createSimpleFetcher, getWsFetcher } from '../../create-fetcher/lib';
import type { TransportResponse } from '../types';

// Keep the real HTTP transport helpers; only stub the ws fetcher so no real
// socket is required.
vi.mock('../../create-fetcher/lib', async () => {
  const actual = await vi.importActual('../../create-fetcher/lib');
  return { ...actual, getWsFetcher: vi.fn() };
});

const URL = 'http://localhost:3000/graphql';
const QUERY = '{ __typename }';
const SUBSCRIPTION = 'subscription OnTick { tick }';

function mockResponse(
  body: unknown,
  init: { status?: number; statusText?: string; headers?: HeadersInit } = {},
) {
  return {
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    headers: new Headers(init.headers ?? { 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
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
        { headers: { 'content-type': 'application/json', 'content-length': '42' } },
      ),
    });
    const response = (await transport.send({ query: QUERY })) as TransportResponse;
    expect(response.size.response).toBe(42);
  });

  it('sets ok=false when the response body contains errors', async () => {
    const transport = createTransport({
      url: URL,
      enableIncrementalDelivery: false,
      fetch: mockFetchWith({ data: null, errors: [{ message: 'boom' }] }),
    });
    const response = (await transport.send({ query: QUERY })) as TransportResponse;
    expect(response.ok).toBe(false);
  });
});

describe('createTransport — subscription', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns an AsyncIterable<TransportResponse> with no HTTP envelope', async () => {
    (getWsFetcher as Mock).mockResolvedValue(() =>
      (async function* () {
        yield { data: { tick: 1 } };
        yield { data: { tick: 2 } };
      })(),
    );

    const transport = createTransport({ url: URL, subscriptionUrl: 'ws://x' });
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

  it('throws when no subscription transport is configured', async () => {
    (getWsFetcher as Mock).mockResolvedValue(undefined);
    const transport = createTransport({ url: URL });
    const result = transport.send({ query: SUBSCRIPTION });
    await expect(async () => {
      for await (const _ of result as AsyncIterable<TransportResponse>) {
        // drain
      }
    }).rejects.toThrow(/not configured for subscriptions/);
  });
});

describe('createSimpleFetcher (backward-compatible projection)', () => {
  it('still returns only the parsed body, not the TransportResponse', async () => {
    const fetcher = createSimpleFetcher(
      { url: URL },
      mockFetchWith({ data: { __typename: 'Query' } }),
    );
    const result = await fetcher({ query: QUERY }, {});
    expect(result).toEqual({ data: { __typename: 'Query' } });
  });
});
