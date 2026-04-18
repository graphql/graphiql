import { createSimpleFetcher, createMultipartFetcher } from '../lib';

const SPEC_ACCEPT =
  'application/graphql-response+json, application/json;q=0.9';
const MULTIPART_ACCEPT = `${SPEC_ACCEPT}, multipart/mixed`;

function mockFetch() {
  return vi.fn().mockResolvedValue({
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => ({}),
  });
}

describe('createSimpleFetcher', () => {
  it('sends spec-compliant accept header', async () => {
    const fetch = mockFetch();
    const fetcher = createSimpleFetcher({ url: 'http://localhost' }, fetch);
    await fetcher({ query: '{ __typename }' }, {});

    expect(fetch.mock.calls[0][1].headers.accept).toBe(SPEC_ACCEPT);
  });

  it('allows options.headers to override accept', async () => {
    const fetch = mockFetch();
    const fetcher = createSimpleFetcher(
      { url: 'http://localhost', headers: { accept: 'text/plain' } },
      fetch,
    );
    await fetcher({ query: '{ __typename }' }, {});

    expect(fetch.mock.calls[0][1].headers.accept).toBe('text/plain');
  });

  it('allows per-request fetcherOpts headers to override accept', async () => {
    const fetch = mockFetch();
    const fetcher = createSimpleFetcher({ url: 'http://localhost' }, fetch);
    await fetcher(
      { query: '{ __typename }' },
      { headers: { accept: 'text/plain' } },
    );

    expect(fetch.mock.calls[0][1].headers.accept).toBe('text/plain');
  });
});

describe('createMultipartFetcher', () => {
  it('sends spec-compliant accept header with multipart support', async () => {
    const fetch = mockFetch();
    const fetcher = createMultipartFetcher({ url: 'http://localhost' }, fetch);
    const gen = fetcher({ query: '{ __typename }' }, {});
    await gen.next();

    expect(fetch.mock.calls[0][1].headers.accept).toBe(MULTIPART_ACCEPT);
  });

  it('allows options.headers to override accept', async () => {
    const fetch = mockFetch();
    const fetcher = createMultipartFetcher(
      { url: 'http://localhost', headers: { accept: 'text/plain' } },
      fetch,
    );
    const gen = fetcher({ query: '{ __typename }' }, {});
    await gen.next();

    expect(fetch.mock.calls[0][1].headers.accept).toBe('text/plain');
  });
});
