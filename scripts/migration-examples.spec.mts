import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { transpileModule, ModuleKind } from 'typescript';

const guide = await readFile(
  new URL('../docs/migration/graphiql-6.0.0.md', import.meta.url),
  'utf8',
);
const section = guide.split('**After (custom transport):**')[1];
assert.ok(section, 'The custom transport section must exist.');
const snippet = /```ts\n([\s\S]*?)\n```/.exec(section)?.[1];
assert.ok(snippet, 'The custom transport example must remain runnable.');
const { outputText } = transpileModule(`${snippet}\nexport { transport };`, {
  compilerOptions: { module: ModuleKind.ESNext },
});
const { transport } = await import(
  `data:text/javascript,${encodeURIComponent(outputText)}`
);

test('the guide custom transport preserves HTTP failures and request options', async t => {
  const controller = new AbortController();
  const requests: RequestInit[] = [];
  let response = new Response();
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      requests.push(options!);
      return response;
    },
  );

  for (const [status, body, ok] of [
    [500, { data: null }, false],
    [200, { errors: [{ message: 'Invalid operation' }] }, false],
    [200, { data: { hello: 'Hello' } }, true],
  ] as const) {
    const text = JSON.stringify(body);
    response = new Response(text, {
      status,
      headers: { 'x-example': 'migration' },
    });
    const result = await transport.send({
      query: '{ hello }',
      variables: { id: '1' },
      extensions: { trace: true },
      headers: { authorization: 'Bearer example' },
      signal: controller.signal,
    });
    assert.equal(result.ok, ok);
    assert.equal(result.status, status);
    assert.deepEqual(result.body, body);
    assert.equal(result.headers['x-example'], 'migration');
    assert.equal(result.size.response, new TextEncoder().encode(text).length);
  }
  assert.equal(transport.url, '/graphql');
  assert.equal(transport.method, 'POST');
  assert.deepEqual(transport.supportedMethods, ['POST']);
  assert.equal(requests[0].signal, controller.signal);
  assert.equal(
    new Headers(requests[0].headers).get('authorization'),
    'Bearer example',
  );
  assert.deepEqual(JSON.parse(requests[0].body as string), {
    query: '{ hello }',
    variables: { id: '1' },
    extensions: { trace: true },
  });
});
