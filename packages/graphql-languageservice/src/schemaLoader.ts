import {
  getIntrospectionQuery,
  IntrospectionOptions,
  IntrospectionQuery,
  DocumentNode,
  BuildSchemaOptions,
  buildClientSchema,
  buildASTSchema,
} from 'graphql';

export type SchemaConfig = {
  uri: string;
  requestOpts?: RequestInit;
  introspectionOptions?: IntrospectionOptions;
  buildSchemaOptions?: BuildSchemaOptions;
};

export type SchemaResponse = IntrospectionQuery | DocumentNode;

export type SchemaLoader = (config: SchemaConfig) => Promise<SchemaResponse>;

export const defaultSchemaLoader: SchemaLoader = async (
  schemaConfig: SchemaConfig,
): Promise<SchemaResponse> => {
  const { requestOpts, uri, introspectionOptions } = schemaConfig;
  const rawResult = await fetch(uri, {
    method: requestOpts?.method ?? 'post',
    body: JSON.stringify({
      query: getIntrospectionQuery(introspectionOptions),
      operationName: 'IntrospectionQuery',
    }),
    credentials: 'omit',
    headers: requestOpts?.headers || {
      'Content-Type': 'application/json',
    },
    ...requestOpts,
  });

  const introspectionResponse: {
    data: IntrospectionQuery;
  } = await rawResult.json();

  return introspectionResponse?.data;
};
/**
 *
 * @param response {DocumentNode | IntrospectionQuery} response from retrieving schema
 * @param buildSchemaOptions {BuildSchemaOptions} options for building schema
 */
export function buildSchemaFromResponse(
  response: SchemaResponse,
  buildSchemaOptions?: BuildSchemaOptions,
) {
  if (!response) {
    throw Error('Empty schema response');
  }
  // if we have this property, it's an introspectionQuery
  if ('__schema' in response) {
    return buildClientSchema(response, buildSchemaOptions);
  }
  return buildASTSchema(response, buildSchemaOptions);
}
