import {
  IntrospectionQuery,
  DocumentNode,
  BuildSchemaOptions,
  buildClientSchema,
  buildASTSchema,
  GraphQLSchema,
} from 'graphql';

import { LanguageService } from './LanguageService';

export type BaseSchemaConfig = {
  buildSchemaOptions?: BuildSchemaOptions;
  schema?: GraphQLSchema;
  documentString?: string;
  documentAST?: DocumentNode;
  introspectionJSON?: IntrospectionQuery;
  introspectionJSONString?: string;
};

export type SchemaConfig = {
  /**
   * A unique URI for this schema.
   * Model data will be set
   */
  uri: string;
  fileMatch?: string[];
  buildSchemaOptions?: BuildSchemaOptions;
  schema?: GraphQLSchema;
  documentString?: string;
  documentAST?: DocumentNode;
  introspectionJSON?: IntrospectionQuery;
  introspectionJSONString?: string;
};

/**
 * This schema loader is focused on performance for the monaco worker runtime
 * We favor taking in stringified schema representations as they can be used to communicate
 * Across the main/webworker process boundary
 *
 * @param schemaConfig {SchemaConfig}
 * @param parser {LanguageService['parse']}
 * @returns {GraphQLSchema}
 */
export type SchemaLoader = (
  schemaConfig: SchemaConfig,
  parser: LanguageService['parse'],
) => GraphQLSchema;

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
  if (documentString) {
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
