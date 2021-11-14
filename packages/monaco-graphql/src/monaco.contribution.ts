/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as mode from './graphqlMode';
import {
  MonacoGraphQLAPI,
  schemaDefault,
  formattingDefaults,
  modeConfigurationDefault,
  SchemaEntry,
} from './api';
import { MonacoGraphQLInitializeConfig } from './typings';

export { MonacoGraphQLAPI, modeConfigurationDefault, SchemaEntry };
import * as monaco from 'monaco-editor';

export * from './typings';

export const LANGUAGE_ID = 'graphql';

export async function initialize({
  schemaConfig,
  formattingOptions,
  modeConfiguration,
}: MonacoGraphQLInitializeConfig) {
  monaco.languages.register({
    id: LANGUAGE_ID,
    mimetypes: ['application/graphql', 'text/graphql'],
  });

  const api = new MonacoGraphQLAPI({
    languageId: LANGUAGE_ID,
    schemaConfig: {
      ...schemaDefault,
      ...schemaConfig,
    },
    formattingOptions: {
      ...formattingDefaults,
      ...formattingOptions,
      prettierConfig: {
        ...formattingDefaults.prettierConfig,
        ...formattingOptions?.prettierConfig,
      },
    },
    modeConfiguration: {
      ...modeConfigurationDefault,
      ...modeConfiguration,
    },
  });

  const graphqlMode = await getMode();
  graphqlMode.setupMode(api);

  if (api.schemaConfig.loadSchemaOnInit) {
    api.getSchema().catch(console.error);
  }
  return api;
}
function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}
