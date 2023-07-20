/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as GraphiQLReact from '@graphiql/react';
import { createGraphiQLFetcher, createLocalStorage } from '@graphiql/toolkit';
import * as GraphQL from 'graphql';
import { GraphiQL } from './components/GraphiQL';

import '@graphiql/react/font/roboto.css';
import '@graphiql/react/font/fira-code.css';
import '@graphiql/react/dist/style.css';
import './style.css';

/**
 * For the CDN bundle we add some static properties to the component function
 * so that they can be accessed in the inline-script in the HTML file.
 */

/**
 * This function is needed in order to easily create a fetcher function.
 */
// @ts-expect-error
GraphiQL.createFetcher = createGraphiQLFetcher;

/**
 * This function is needed in order to easily generate a custom storage namespace
 */
// @ts-expect-error
GraphiQL.createLocalStorage = createLocalStorage;

/**
 * We also add the complete `graphiql-js` exports so that this instance of
 * `graphiql-js` can be reused from plugin CDN bundles.
 */
// @ts-expect-error
GraphiQL.GraphQL = GraphQL;

/**
 * We also add the complete `@graphiql/react` exports. These will be included
 * in the bundle anyway since they make up the `GraphiQL` component, so by
 * doing this we can reuse them from plugin CDN bundles.
 */
// @ts-expect-error
GraphiQL.React = GraphiQLReact;

export default GraphiQL;
