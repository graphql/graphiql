import {
  getIntrospectionQuery,
  IntrospectionOptions,
  IntrospectionQuery,
  DocumentNode,
  BuildSchemaOptions,
  buildClientSchema,
  buildASTSchema,
  GraphQLSchema,
  printSchema,
} from 'graphql';

import { LanguageService } from './LanguageService';

export type SchemaConfig = {
  uri?: string;
  // eslint-disable-next-line no-undef
  requestOpts?: RequestInit;
  introspectionOptions?: IntrospectionOptions;
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
) => Promise<SchemaLoaderResult | null>;

/**
 * This schema loader is focused on performance for the monaco runtime
 * We favor stringified schema representations as they can be used to communicate
 * Across the main/webworker process boundary
 * @param schemaConfig
 * @param parser
 * @returns
 */
export const defaultSchemaLoader: SchemaLoader = async (
  schemaConfig,
  parser,
) => {
  const {
    requestOpts,
    uri,
    introspectionOptions,
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
  if (introspectionJSON) {
    return {
      schema: buildClientSchema(introspectionJSON, buildSchemaOptions),
      introspectionJSON,
      introspectionJSONString: JSON.stringify(introspectionJSON),
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
  if (documentAST) {
    const schema = buildASTSchema(documentAST, buildSchemaOptions);
    return {
      schema,
      documentAST,
      documentString: printSchema(schema),
    };
  }
  if (documentString) {
    return {
      schema: buildASTSchema(parser(documentString), buildSchemaOptions),
      documentString,
    };
  }
  // at this point only HTTP requests are left
  if (!uri) {
    return null;
  }
  const fetchResult = await fetch(uri, {
    method: requestOpts?.method ?? 'post',
    body: JSON.stringify({
      query: getIntrospectionQuery(introspectionOptions),
      operationName: 'IntrospectionQuery',
    }),
    credentials: 'omit',
    ...requestOpts,
    headers: {
      'Content-Type': 'application/json',
      ...requestOpts?.headers,
    },
  });
  const { data }: { data: IntrospectionQuery } = await fetchResult.json();
  return {
    schema: buildClientSchema(data, buildSchemaOptions),
    introspectionJSON: data,
    introspectionJSONString: JSON.stringify(data),
  };
};
