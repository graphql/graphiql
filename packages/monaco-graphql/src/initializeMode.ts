/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type * as GraphQLMode from './graphqlMode';
import { create as createMonacoGraphQLAPI, MonacoGraphQLAPI } from './api';
import type { MonacoGraphQLInitializeConfig } from './typings';

import { languages } from 'monaco-editor';

export const LANGUAGE_ID = 'graphql';

/**
 * Initialize the mode & worker synchronously with provided configuration
 *
 * @param config
 * @returns {MonacoGraphQLAPI}
 */
export function initializeMode(
  config?: MonacoGraphQLInitializeConfig,
): MonacoGraphQLAPI {
  const api = createMonacoGraphQLAPI(LANGUAGE_ID, config);

  // export to the global monaco API
  (<any>languages)[LANGUAGE_ID] = { api };

  languages.onLanguage(LANGUAGE_ID, () => {
    getMode().then(mode => mode.setupMode(api));
  });

  return api;
}
function getMode(): Promise<typeof GraphQLMode> {
  return import('./graphqlMode');
}
