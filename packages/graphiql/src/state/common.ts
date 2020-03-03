import { GraphQLSchema, buildClientSchema } from 'graphql';

import {
  introspectionQuery,
  introspectionQueryName,
} from '../utility/introspectionQueries';

import { SchemaConfig, GraphQLParams } from './types';

export const defaultSchemaLoader = async (
  schemaConfig: SchemaConfig,
): Promise<GraphQLSchema | void> => {
  const rawResult = await fetch(schemaConfig.uri, {
    method: 'post',
    body: JSON.stringify({
      query: introspectionQuery,
      operationName: introspectionQueryName,
    }),
    headers: { 'Content-Type': 'application/json', credentials: 'omit' },
  });

  const introspectionResponse = await rawResult.json();

  if (!introspectionResponse || !introspectionResponse.data) {
    throw Error('error fetching introspection schema');
  }
  return buildClientSchema(introspectionResponse.data, {
    assumeValid: true,
  });
};

export const defaultFetcher = async (
  graphqlParams: GraphQLParams,
  schemaConfig: SchemaConfig,
): Promise<string> => {
  try {
    const rawResult = await fetch(schemaConfig.uri, {
      method: 'post',
      body: JSON.stringify(graphqlParams),
      headers: { 'Content-Type': 'application/json', credentials: 'omit' },
    });
    return rawResult.text()
    // if (result.errors && result.errors.length > 0) {
    //   throw new Error(result.errors.map(({ message }) => message).join("\n"))
    // }
    // return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
