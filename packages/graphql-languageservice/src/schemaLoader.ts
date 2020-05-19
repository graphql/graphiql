import {
  IntrospectionQuery,
  DocumentNode,
  BuildSchemaOptions,
  buildClientSchema,
  buildASTSchema,
} from 'graphql';

export type SchemaResponse = IntrospectionQuery | DocumentNode;

export type SchemaLoader = () => Promise<SchemaResponse>;

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
