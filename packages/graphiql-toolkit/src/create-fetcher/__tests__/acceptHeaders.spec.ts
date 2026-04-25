import { createSimpleFetcher, createMultipartFetcher } from '../lib';

const SPEC_ACCEPT = 'application/graphql-response+json, application/json;q=0.9';
const MULTIPART_ACCEPT = 'application/json, multipart/mixed';
const QUERY = '{ __typename }';
const BASE_URL = 'http://localhost';

function mockFetch() {
  return vi.fn().mockResolvedValue({
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => ({}),
  });
}

describe('createSimpleFetcher', () => {
  it('sends spec-compliant accept header', async () => {
    const fetch = mockFetch();
    const fetcher = createSimpleFetcher({ url: BASE_URL }, fetch);
    await fetcher({ query: QUERY }, {});

    expect(fetch.mock.calls[0][1].headers.accept).toBe(SPEC_ACCEPT);
  });

  it('allows options.headers to override accept', async () => {
    const fetch = mockFetch();
    const fetcher = createSimpleFetcher(
      { url: BASE_URL, headers: { accept: 'text/plain' } },
      fetch,
    );
    await fetcher({ query: QUERY }, {});

    expect(fetch.mock.calls[0][1].headers.accept).toBe('text/plain');
  });

  it('allows per-request fetcherOpts headers to override accept', async () => {
    const fetch = mockFetch();
    const fetcher = createSimpleFetcher({ url: BASE_URL }, fetch);
    await fetcher({ query: QUERY }, { headers: { accept: 'text/plain' } });

    expect(fetch.mock.calls[0][1].headers.accept).toBe('text/plain');
  });
});

describe('createMultipartFetcher', () => {
  it('sends accept header with multipart support', async () => {
    const fetch = mockFetch();
    const fetcher = createMultipartFetcher({ url: BASE_URL }, fetch);
    const result = fetcher({ query: QUERY }, {});
    // @ts-expect-error -- result is an async generator at runtime
    await result.next();

    expect(fetch.mock.calls[0][1].headers.accept).toBe(MULTIPART_ACCEPT);
  });

  it('allows options.headers to override accept', async () => {
    const fetch = mockFetch();
    const fetcher = createMultipartFetcher(
      { url: BASE_URL, headers: { accept: 'text/plain' } },
      fetch,
    );
    const result = fetcher({ query: QUERY }, {});
    // @ts-expect-error -- result is an async generator at runtime
    await result.next();

    expect(fetch.mock.calls[0][1].headers.accept).toBe('text/plain');
  });
});
