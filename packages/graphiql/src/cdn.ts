/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import 'regenerator-runtime/runtime';

import { createGraphiQLFetcher } from '@graphiql/toolkit';

import './css/app.css';
import './css/codemirror.css';
import './css/foldgutter.css';
import './css/info.css';
import './css/jump.css';
import './css/lint.css';
import './css/loading.css';
import './css/show-hint.css';

import './css/doc-explorer.css';
import './css/history.css';

import { GraphiQL } from './components/GraphiQL';
// add the static function here for CDN only. otherwise, doing this in the component could
// add unwanted dependencies to the bundle.
// @ts-expect-error
GraphiQL.createFetcher = createGraphiQLFetcher;

export default GraphiQL;
