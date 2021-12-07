import { buildClientSchema, buildASTSchema } from 'graphql';

import type { SchemaLoader } from './typings';

export const defaultSchemaLoader: SchemaLoader = (schemaConfig, parser) => {
  const {
    schema,
    documentAST,
    introspectionJSON,
    introspectionJSONString,
    buildSchemaOptions,
    documentString,
  } = schemaConfig;
  if (schema) {
    return schema;
  }
  if (introspectionJSONString) {
    const introspectionJSONResult = JSON.parse(introspectionJSONString);
    return buildClientSchema(introspectionJSONResult, buildSchemaOptions);
  }
  if (documentString && parser) {
    const docAST = parser(documentString);
    return buildASTSchema(docAST, buildSchemaOptions);
  }
  if (introspectionJSON) {
    return buildClientSchema(introspectionJSON, buildSchemaOptions);
  }
  if (documentAST) {
    return buildASTSchema(documentAST, buildSchemaOptions);
  }
  throw Error('no schema supplied');
};
