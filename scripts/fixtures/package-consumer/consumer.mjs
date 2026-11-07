import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '@graphiql/react';
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import { buildSchema } from 'graphql';
import { getDiagnostics } from 'graphql-language-service';

const require = createRequire(import.meta.url);
const schema = buildSchema('type Query { hello: String }');
assert.deepEqual(getDiagnostics('{ hello }', schema), []);
assert.ok(getDiagnostics('{ unknown }', schema).length > 0);
assert.deepEqual(
  require('graphql-language-service').getDiagnostics('{ hello }', schema),
  [],
);
assert.equal(
  typeof require('graphql-language-service-server').startServer,
  'function',
);
assert.match(
  renderToStaticMarkup(createElement(Button, null, 'Consumer')),
  /Consumer/,
);
const transport = createTransport({ url: 'http://localhost/graphql', fetch });
assert.doesNotThrow(() =>
  renderToStaticMarkup(createElement(GraphiQL, { schema, transport })),
);

const { LanguageService } = require('monaco-graphql/dist/LanguageService.js');
const service = new LanguageService({
  schemas: [
    { uri: 'app.graphql', schema, fileMatch: ['**/app/**/*.{graphql,gql}'] },
    { uri: 'admin.graphql', schema, fileMatch: ['**/admin/**/*.graphql'] },
  ],
});
assert.equal(
  service.getSchemaForFile('file:///workspace/app/query.graphql')?.uri,
  'app.graphql',
);
assert.equal(
  service.getSchemaForFile('file:///workspace/app/nested/query.gql')?.uri,
  'app.graphql',
);
assert.equal(
  service.getSchemaForFile('file:///workspace/admin/query.graphql')?.uri,
  'admin.graphql',
);
assert.equal(
  service.getSchemaForFile('file:///workspace/other/query.graphql'),
  undefined,
);
