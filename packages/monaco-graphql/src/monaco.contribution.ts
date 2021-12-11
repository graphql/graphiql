/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

export {
  modeConfigurationDefault,
  SchemaEntry,
  formattingDefaults,
  MonacoGraphQLAPI,
  MonacoGraphQLAPIOptions,
  diagnosticSettingDefault,
} from './api';

import { languages } from 'monaco-editor';

export * from './typings';
import { initializeMode, LANGUAGE_ID } from './initializeMode';

export { LANGUAGE_ID };
// here is the only place where we
// initialize the mode `onLanguage`
languages.onLanguage(LANGUAGE_ID, () => {
  const api = initializeMode();

  (<any>languages).graphql = { api };
});
/**
 * Register the language mode without schema or any settings, so you can configure them asynchronously.
 */
