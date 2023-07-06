/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { languages } from './monaco-editor.js';
import { initializeMode, LANGUAGE_ID } from './initializeMode.js';

export { LANGUAGE_ID };

// here is the only place where we
// initialize the mode `onLanguage`
languages.onLanguage(LANGUAGE_ID, () => {
  const api = initializeMode();

  (languages as any).graphql = { api };
});
/**
 * Register the language mode without schema or any settings, so you can configure them asynchronously.
 */
