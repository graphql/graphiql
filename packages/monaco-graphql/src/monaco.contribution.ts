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

export { MonacoGraphQLAPI, modeConfigurationDefault, SchemaEntry };
import * as monaco from 'monaco-editor';
import { SchemaConfig } from 'graphql-language-service';

export * from './typings';

export const LANGUAGE_ID = 'graphql';

monaco.languages.register({
  id: LANGUAGE_ID,
  mimetypes: ['application/graphql', 'text/graphql'],
});

export async function initialize({
  schemaConfig,
}: {
  schemaConfig: SchemaConfig;
}) {
  const api = new MonacoGraphQLAPI({
    languageId: LANGUAGE_ID,
    schemaConfig: schemaConfig || schemaDefault,
    formattingOptions: formattingDefaults,
    modeConfiguration: modeConfigurationDefault,
  });
  const graphqlMode = await getMode();
  graphqlMode.setupMode(api);
  return api;
}
function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}
