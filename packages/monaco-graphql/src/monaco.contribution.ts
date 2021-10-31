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
import { SchemaConfig } from 'graphql-language-service';

export * from './typings';

export const LANGUAGE_ID = 'graphqlDev';

monaco.languages.register({
  id: LANGUAGE_ID,
  mimetypes: ['application/graphql', 'text/graphql'],
});

export async function init({ schemaConfig }: { schemaConfig: SchemaConfig }) {
  const api = new LanguageServiceAPI({
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
