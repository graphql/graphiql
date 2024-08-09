/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import '@graphiql/react/font/roboto.css';
import '@graphiql/react/font/fira-code.css';
import '@graphiql/react/dist/style.css';
import './style.css';

/**
 * GraphiQL
 */
export { GraphiQLProvider } from '@graphiql/react';

/**
 * Definitions
 */
export type {
  GraphiQLProps,
  GraphiQLInterfaceProps,
} from './components/GraphiQL';
export type { GraphiQLProviderProps } from '@graphiql/react';

export { GraphiQLInterface, GraphiQL } from './components/GraphiQL';
