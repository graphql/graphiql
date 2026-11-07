import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const requireFromExtension = createRequire(
  new URL('../packages/vscode-graphql-execution/package.json', import.meta.url),
);
const { loadConfig } = requireFromExtension('graphql-config');
const { buildSchema, graphql } = requireFromExtension('graphql');

test(
  'execution config loads remote schemas and local fragments',
  { timeout: 15_000 },
  async context => {
    const directory = await mkdtemp(
      join(tmpdir(), 'graphiql-execution-config-'),
    );
    const schema = buildSchema('type Query { greeting: String }');
    const headers: unknown[] = [];
    const server = createServer(async (request, response) => {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const operation = JSON.parse(body);
      headers.push(request.headers['x-schema-test']);
      const result = await graphql({
        schema,
        source: operation.query,
        variableValues: operation.variables,
      });
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(result));
    });
    context.after(async () => {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
      await rm(directory, { recursive: true, force: true });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/graphql`;
    const filepath = join(directory, 'graphql.config.json');
    await writeFile(
      filepath,
      JSON.stringify({
        schema: {
          [url]: { headers: { 'x-schema-test': 'runtime-compatibility' } },
        },
        documents: './*.graphql',
      }),
    );
    await writeFile(
      join(directory, 'operation.graphql'),
      'fragment GreetingFields on Query { greeting }\nquery Greeting { ...GreetingFields }',
    );

    const config = await loadConfig({ filepath });
    assert.ok(config);
    const project = config.getDefault();
    const loadedSchema = await project.getSchema();
    assert.ok(loadedSchema.getQueryType()?.getFields().greeting);
    assert.ok(headers.length > 0);
    assert.ok(headers.every(header => header === 'runtime-compatibility'));

    const documents = await project.getDocuments();
    assert.equal(documents.length, 1);
    assert.deepEqual(
      documents[0].document.definitions.map(
        (definition: { name?: { value: string } }) => definition.name?.value,
      ),
      ['GreetingFields', 'Greeting'],
    );
  },
);
