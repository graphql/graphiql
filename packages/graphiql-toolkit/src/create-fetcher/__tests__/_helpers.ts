/* eslint-disable */

import { Mock, it as itBase } from 'vitest';

export const test = itBase.extend<{
  fetch: Mock<typeof fetch>;
  graphqlWs: {
    createClient: Mock<
      (parameters: { connectionParams: Record<string, string> }) => any
    >;
  };
}>({
  // @ts-expect-error fixme
  fetch: async ({}, use) => {
    const originalFetch = globalThis.fetch;
    const mock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: {} })));
    globalThis.fetch = mock;
    await use(fetch);
    globalThis.fetch = originalFetch;
  },
  graphqlWs: async ({}, use) => {
    const graphqlWsExports = {
      createClient: vi.fn(() => {
        return {
          subscribe: vi.fn(),
        };
      }),
    };
    vi.doMock('graphql-ws', () => {
      return graphqlWsExports;
    });
    await use(graphqlWsExports);
  },
});
