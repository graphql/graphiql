/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as mode from './graphqlMode';
import {
  LanguageServiceDefaultsImpl,
  diagnosticDefault,
  modeConfigurationDefault,
} from './defaults';

import * as monaco from 'monaco-editor';

// @ts-ignore
export { language as monarchLanguage } from 'monaco-languages/release/esm/graphql/graphql';

export const LANGUAGE_ID = 'graphqlDev';

monaco.languages.register({
  id: LANGUAGE_ID,
  extensions: ['.graphql', '.gql'],
  aliases: ['graphql'],
  mimetypes: ['application/graphql', 'text/graphql'],
});

const graphqlDefaults = new LanguageServiceDefaultsImpl(
  LANGUAGE_ID,
  diagnosticDefault,
  modeConfigurationDefault,
);

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
