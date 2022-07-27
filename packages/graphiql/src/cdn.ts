/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import 'regenerator-runtime/runtime';

import { createGraphiQLFetcher } from '@graphiql/toolkit';

import '@graphiql/react/font/roboto.css';
import '@graphiql/react/font/fira-code.css';
import '@graphiql/react/dist/style.css';
import './style.css';

// Legacy styles
import './css/app.css';

import { GraphiQL } from './components/GraphiQL';
// add the static function here for CDN only. otherwise, doing this in the component could
// add unwanted dependencies to the bundle.
// @ts-expect-error
GraphiQL.createFetcher = createGraphiQLFetcher;

export default GraphiQL;
