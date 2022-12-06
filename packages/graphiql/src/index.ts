/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * GraphiQL
 */

import {
  GraphiQL,
  GraphiQLInterface,
  useInterfaceContext,
} from './components/GraphiQL';
export { GraphiQL, GraphiQLInterface, useInterfaceContext };
export { GraphiQLProvider } from '@graphiql/react';
export default GraphiQL;

/**
 * Definitions
 */
export type {
  GraphiQLProps,
  GraphiQLInterfaceProps,
  InterfaceContextType,
} from './components/GraphiQL';
export type { GraphiQLProviderProps } from '@graphiql/react';
