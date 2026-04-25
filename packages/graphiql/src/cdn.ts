/**
 *  Copyright (c) 2025 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { version } from 'react';
import * as GraphiQLReact from '@graphiql/react';
import { createGraphiQLFetcher, createLocalStorage } from '@graphiql/toolkit';
import * as GraphQL from 'graphql';
import { GraphiQL } from './GraphiQL';
import './setup-workers/vite';

const majorVersion = parseInt(version.slice(0, 2), 10);

if (majorVersion < 16) {
  throw new Error(
    [
      'GraphiQL 0.18.0 and after is not compatible with React 15 or below.',
      'If you are using a CDN source (jsdelivr, unpkg, etc), follow this example:',
      'https://github.com/graphql/graphiql/blob/master/examples/graphiql-cdn/index.html#L49',
    ].join('\n'),
  );
}

/**
 * For the CDN bundle we add some static properties to the component function
 * so that they can be accessed in the inline-script in the HTML file.
 */
export default Object.assign(GraphiQL, {
  /**
   * This function is needed in order to easily create a fetcher function.
   */
  createFetcher: createGraphiQLFetcher,
  /**
   * This function is needed in order to easily generate a custom storage namespace
   */
  createLocalStorage,
  /**
   * We also add the complete `graphiql-js` exports so that this instance of
   * `graphiql-js` can be reused from plugin CDN bundles.
   */
  GraphQL,
  /**
   * We also add the complete `@graphiql/react` exports. These will be included
   * in the bundle anyway since they make up the `GraphiQL` component, so by
   * doing this we can reuse them from plugin CDN bundles.
   */
  React: GraphiQLReact,
});
