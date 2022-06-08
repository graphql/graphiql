/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import fetchMock from 'fetch-mock';
import {
  SchemaContext,
  SchemaProvider,
  SchemaProviderProps,
} from '../GraphiQLSchemaProvider';
import { loadConfig } from 'graphql-config';
import { introspectionFromSchema } from 'graphql';
import path from 'path';
import { renderProvider, getProviderData } from './util';

const configDir = path.join(
  __dirname,
  '../../../../../../packages/graphql-language-service-server/src/__tests__',
);

const renderSchemaProvider = (props: SchemaProviderProps) =>
  renderProvider(SchemaProvider, SchemaContext, props);

const wait = async (delay: number = 1000) => setTimeout(Promise.resolve, delay);

describe('GraphiQLSchemaProvider', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('SchemaProvider loads the schema', async () => {
    const graphQLRC = await loadConfig({ rootDir: configDir });

    const introspectionResult = {
      data: introspectionFromSchema(
        await graphQLRC.getProject('testWithSchema').getSchema(),
        { descriptions: true },
      ),
    };
    fetchMock.post('https://example', {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
      body: introspectionResult,
    });
    const provider = await renderSchemaProvider({
      config: { uri: 'https://example' },
    });
    await wait(1000);
    const { schema, isLoading, error } = getProviderData(provider);
    expect(schema).toBeTruthy();
    expect(isLoading).toEqual(false);
    expect(error).toBeFalsy();
  });

  it('SchemaProvider errors on bad schema', async () => {
    fetchMock.post(
      'https://bad',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 500,
        body: { errors: ['invalid introspection query'] },
      },
      { overwriteRoutes: true },
    );
    const provider = await renderSchemaProvider({
      config: { uri: 'https://bad' },
    });
    const { schema } = getProviderData(provider);
    expect(schema).toBeFalsy();
    const { hasError, error } = getProviderData(provider);
    expect(hasError).toBeTruthy();
    expect(error).toEqual('Error: error fetching introspection schema');
  });
});
