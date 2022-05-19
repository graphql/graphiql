/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * GraphiQL
 */

import { GraphiQL } from './components/GraphiQL';
export { GraphiQL };
export default GraphiQL;

/**
 * Definitions
 */
export type { GraphiQLProps } from './components/GraphiQL';

export type {
  Fetcher,
  FetcherOpts,
  FetcherParams,
  FetcherResult,
  FetcherReturnType,
  Observable,
  Storage,
  SyncFetcherResult,
} from '@graphiql/toolkit';
/**
 * Components
 */

export { QueryEditor } from './components/QueryEditor';
export { VariableEditor } from './components/VariableEditor';
export { DocExplorer } from './components/DocExplorer';

/**
 * Toolbar
 */
export { ToolbarMenu, ToolbarMenuItem } from './components/ToolbarMenu';
export { ToolbarButton } from './components/ToolbarButton';
export { ToolbarGroup } from './components/ToolbarGroup';
export { ToolbarSelect, ToolbarSelectOption } from './components/ToolbarSelect';

/**
 * Utilities
 */
export { fillLeafs } from './utility/fillLeafs';
export { default as mergeAst } from './utility/mergeAst';
export { default as getSelectedOperationName } from './utility/getSelectedOperationName';

/**
 * Legacy exports
 */
import { onHasCompletion as _onHasCompletion } from '@graphiql/react';

export const onHasCompletion: typeof _onHasCompletion = function onHasCompletion(
  ...args
) {
  console.warn(
    'Importing `onHasCompletion` from `graphiql` is deprecated and will be removed in the next major version. Please switch to importing the `onHasCompletion` function provided by the `@graphiql/react` package.',
  );
  return _onHasCompletion(...args);
};
