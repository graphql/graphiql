import {
  IntrospectionQuery,
  DocumentNode,
  BuildSchemaOptions,
  buildClientSchema,
  buildASTSchema,
  GraphQLSchema,
  printSchema,
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

export type SchemaLoaderResult = {
  schema: GraphQLSchema;
  introspectionJSON?: IntrospectionQuery;
  introspectionJSONString?: string;
  documentString?: string;
  documentAST?: DocumentNode;
};

export type SchemaLoader = (
  schemaConfig: SchemaConfig,
  parser: LanguageService['parse'],
) => SchemaLoaderResult;

/**
 * This schema loader is focused on performance for the monaco runtime
 * We favor stringified schema representations as they can be used to communicate
 * Across the main/webworker process boundary
 * @param schemaConfig
 * @param parser
 * @returns
 */
export const defaultSchemaLoader: SchemaLoader = (schemaConfig, parser) => {
  const {
    schema: graphQLSchema,
    documentAST,
    introspectionJSON,
    introspectionJSONString,
    buildSchemaOptions,
    documentString,
  } = schemaConfig;
  if (graphQLSchema) {
    return {
      schema: graphQLSchema,
      documentString: printSchema(graphQLSchema),
    };
  }
  if (introspectionJSONString) {
    const introspectionJSONResult = JSON.parse(introspectionJSONString);
    return {
      introspectionJSON: introspectionJSONResult,
      schema: buildClientSchema(introspectionJSONResult, buildSchemaOptions),
      introspectionJSONString,
    };
  }
  if (documentString) {
    const docAST = parser(documentString);
    return {
      schema: buildASTSchema(docAST, buildSchemaOptions),
      documentAST: docAST,
      documentString,
    };
  }
  if (introspectionJSON) {
    return {
      schema: buildClientSchema(introspectionJSON, buildSchemaOptions),
      introspectionJSON,
      introspectionJSONString: JSON.stringify(introspectionJSON),
    };
  }

  if (documentAST) {
    const schema = buildASTSchema(documentAST, buildSchemaOptions);
    return {
      schema,
      documentAST,
      documentString: printSchema(schema),
    };
  }
  throw Error('no schema supplied');
};
