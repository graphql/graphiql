import * as React from 'react';
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import { buildSchema } from 'graphql';
import { getDiagnostics, type Diagnostic } from 'graphql-language-service';
import type { SchemaConfig } from 'monaco-graphql';

const schema = buildSchema('type Query { hello: String }');
const transport = createTransport({ url: 'http://localhost/graphql', fetch });
const diagnostics: Diagnostic[] = getDiagnostics('{ unknown }', schema);
const message: string = diagnostics[0]!.message;
const schemaConfig: SchemaConfig = {
  uri: 'schema.graphql',
  schema,
  fileMatch: ['**/*.{graphql,gql}'],
};
const app: React.ReactElement = (
  <GraphiQL schema={schema} transport={transport} />
);

export { app, message, schemaConfig };
