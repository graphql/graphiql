/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type * as GraphQLMode from './graphqlMode';
import { create as createMonacoGraphQLAPI } from './api';
import type { MonacoGraphQLInitializeConfig } from './typings';

export {
  MonacoGraphQLAPI,
  modeConfigurationDefault,
  SchemaEntry,
  diagnosticSettingDefault,
  formattingDefaults,
} from './api';

import { languages } from 'monaco-editor';

export * from './typings';

export const LANGUAGE_ID = 'graphql';

export function initializeMode(config?: MonacoGraphQLInitializeConfig) {
  const api = createMonacoGraphQLAPI(LANGUAGE_ID, config);

  // export to the global monaco API
  (<any>languages).graphql = { api };

  languages.onLanguage(LANGUAGE_ID, () => {
    getMode().then(mode => mode.setupMode(api));
  });

  return api;
}
function getMode(): Promise<typeof GraphQLMode> {
  return import('./graphqlMode');
}
