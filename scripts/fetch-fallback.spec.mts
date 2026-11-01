import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import test from 'node:test';

const { getFetch } = await import(
  new URL(
    '../packages/vscode-graphql-execution/src/helpers/fetch.ts',
    import.meta.url,
  ).href
);
const requireFromExtension = createRequire(
  new URL('../packages/vscode-graphql-execution/package.json', import.meta.url),
);
const { createClient, fetchExchange } = requireFromExtension('@urql/core');

test('the execution transport prefers the native fetch implementation', () => {
  assert.equal(getFetch(), globalThis.fetch);
});

test('the fallback handles urql POSTs, headers, JSON and multipart responses', async () => {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch')!;
  Reflect.deleteProperty(globalThis, 'fetch');
  const requests: { method?: string; header?: string; body: string }[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    requests.push({
      method: req.method,
      header: req.headers['x-test'] as string,
      body,
    });
    if (req.url === '/stream') {
      res.setHeader('content-type', 'multipart/mixed; boundary="graphql"');
      res.end(
        [
          '--graphql\r\nContent-Type: application/json\r\n\r\n',
          JSON.stringify({ data: { message: 'first' }, hasNext: true }),
          '\r\n--graphql\r\nContent-Type: application/json\r\n\r\n',
          JSON.stringify({
            incremental: [{ path: [], data: { message: 'last' } }],
            hasNext: false,
          }),
          '\r\n--graphql--\r\n',
        ].join(''),
      );
    } else {
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          data: { message: JSON.parse(body).variables.message },
        }),
      );
    }
  });

  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const client = (path: string) =>
      createClient({
        url: `http://127.0.0.1:${address.port}${path}`,
        fetch: getFetch(),
        fetchOptions: { headers: { 'x-test': 'fallback' } },
        exchanges: [fetchExchange],
      });

    const json = await client('/json')
      .mutation(
        'mutation Echo($message: String!) { message(value: $message) }',
        { message: 'hello' },
      )
      .toPromise();
    assert.equal(json.error, undefined);
    assert.deepEqual(json.data, { message: 'hello' });
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].header, 'fallback');
    assert.deepEqual(JSON.parse(requests[0].body).variables, {
      message: 'hello',
    });

    const streamed = await client('/stream')
      .mutation('mutation Stream { message }', {})
      .toPromise();
    assert.equal(streamed.error, undefined);
    assert.deepEqual(streamed.data, { message: 'last' });
    assert.equal(streamed.hasNext, false);
  } finally {
    Object.defineProperty(globalThis, 'fetch', originalFetch);
    await new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
