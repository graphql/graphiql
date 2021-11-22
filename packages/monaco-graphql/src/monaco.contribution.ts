/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type * as GraphQLMode from './graphqlMode';
import {
  MonacoGraphQLAPI,
  formattingDefaults,
  modeConfigurationDefault,
  SchemaEntry,
  diagnosticSettingDefault,
} from './api';
import type { MonacoGraphQLInitializeConfig } from './typings';

export { MonacoGraphQLAPI, modeConfigurationDefault, SchemaEntry };
import * as monaco from 'monaco-editor';

export * from './typings';

export const LANGUAGE_ID = 'graphql';

export function initializeMode({
  schemas,
  formattingOptions,
  modeConfiguration,
  diagnosticSettings,
}: MonacoGraphQLInitializeConfig) {
  const api = new MonacoGraphQLAPI({
    languageId: LANGUAGE_ID,
    schemas,
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
    diagnosticSettings: {
      ...diagnosticSettingDefault,
      ...diagnosticSettings,
    },
  });

  monaco.languages.onLanguage(LANGUAGE_ID, () => {
    getMode().then(mode => mode.setupMode(api));
  });

  return api;
}
function getMode(): Promise<typeof GraphQLMode> {
  return import('./graphqlMode');
}
