import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { _electron as electron, expect, test } from '@playwright/test';
import { buildSchema, graphql } from 'graphql';

// A generic schema + `graphql()` execution answers any query GraphiQL sends
// (introspection included) without hand-maintaining a canned introspection
// response that'd drift from what `graphql-js` actually expects.
const schema = buildSchema(/* GraphQL */ `
  type Query {
    hello: String
  }
`);

interface MockServer {
  url: string;
  introspectionRequestCount: () => number;
  close: () => Promise<void>;
}

async function startMockGraphQLServer(): Promise<MockServer> {
  let introspectionRequests = 0;

  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      void (async () => {
        const { query, variables, operationName } = JSON.parse(
          Buffer.concat(chunks).toString('utf8'),
        ) as {
          query: string;
          variables?: Record<string, unknown>;
          operationName?: string;
        };

        if (
          operationName === 'IntrospectionQuery' ||
          query.includes('IntrospectionQuery')
        ) {
          introspectionRequests += 1;
        }

        const result = await graphql({
          schema,
          source: query,
          variableValues: variables,
          operationName,
        });

        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(result));
      })();
    });
  });

  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}/graphql`,
    introspectionRequestCount: () => introspectionRequests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

test('loads a schema from the endpoint bar and executes queries through the main process', async () => {
  const mockServer = await startMockGraphQLServer();

  // The built app (`yarn build`) is what's launched here, exercising the
  // real `graphiql-desktop://` scheme handler and IPC bridge rather than a
  // dev server.
  const app = await electron.launch({ args: ['.'] });

  try {
    const window = await app.firstWindow();
    await expect(window).toHaveTitle('GraphiQL');

    const endpointInput = window.locator('#graphiql-desktop-endpoint-input');
    await expect(endpointInput).toBeVisible();

    await endpointInput.fill(mockServer.url);
    await window
      .locator('.graphiql-desktop-endpoint-bar')
      .getByRole('button', { name: 'Connect' })
      .click();

    // A loaded `.graphiql-container` proves the renderer mounted `<GraphiQL>`
    // with a working fetcher; the introspection-request assertion below
    // proves that fetcher actually round-tripped through the main process.
    await expect(window.locator('.graphiql-container')).toBeVisible();

    await expect
      .poll(() => mockServer.introspectionRequestCount(), {
        message: 'expected the main process to fetch an introspection query',
      })
      .toBeGreaterThan(0);
  } finally {
    await app.close();
    await mockServer.close();
  }
});
