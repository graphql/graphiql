/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as mode from './graphqlMode';
import {
  LanguageServiceAPI,
  schemaDefault,
  formattingDefaults,
  modeConfigurationDefault,
} from './api';

import * as monaco from 'monaco-editor';

export * from './typings';

export const LANGUAGE_ID = 'graphqlDev';

monaco.languages.register({
  id: LANGUAGE_ID,
  extensions: ['.graphql', '.gql'],
  aliases: ['graphql'],
  mimetypes: ['application/graphql', 'text/graphql'],
});

export const api = new LanguageServiceAPI({
  languageId: LANGUAGE_ID,
  schemaConfig: schemaDefault,
  formattingOptions: formattingDefaults,
  modeConfiguration: modeConfigurationDefault,
});

monaco.languages.onLanguage(LANGUAGE_ID, async () => {
  const graphqlMode = await getMode();
  graphqlMode.setupMode(api);
});

function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}
