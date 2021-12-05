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

export * from './typings';
import { initializeMode } from './initializeMode';

/**
 * Register the language mode without schema or any settings, so you can configure them asynchronously.
 */
initializeMode();
