/* global monaco */
/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line spaced-comment
/// <reference path='../../../node_modules/monaco-editor/monaco.d.ts'/>
// eslint-disable-next-line spaced-comment
/// <reference path='../../../packages/monaco-graphql/src/typings/monaco.d.ts'/>

import * as mode from './graphqlMode';
import {
  LanguageServiceDefaultsImpl,
  schemaDefault,
  formattingDefaults,
  modeConfigurationDefault,
} from './defaults';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// @ts-ignore
export { language as monarchLanguage } from 'monaco-editor/esm/vs/basic-languages/graphql/graphql';

export const LANGUAGE_ID = 'graphqlDev';

monaco.languages.register({
  id: LANGUAGE_ID,
  extensions: ['.graphql', '.gql'],
  aliases: ['graphql'],
  mimetypes: ['application/graphql', 'text/graphql'],
});

const graphqlDefaults = new LanguageServiceDefaultsImpl({
  languageId: LANGUAGE_ID,
  schemaConfig: schemaDefault,
  formattingOptions: formattingDefaults,
  modeConfiguration: modeConfigurationDefault,
});

// Export API
function createAPI() {
  return {
    graphqlDefaults,
  };
}

// @ts-ignore
monaco.languages.graphql = createAPI();

monaco.languages.onLanguage(LANGUAGE_ID, async () => {
  const graphqlMode = await getMode();
  graphqlMode.setupMode(graphqlDefaults);
});

function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}
