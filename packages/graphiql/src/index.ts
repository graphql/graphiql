/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
// eslint-disable-next-line spaced-comment
/// <reference path='../../../node_modules/monaco-editor/monaco.d.ts'/>
// eslint-disable-next-line spaced-comment
/// <reference path='../../../packages/monaco-graphql/src/typings/monaco.d.ts'/>

import { GraphiQL } from './components/GraphiQL';

export * from './api';
export * from './components/common';

export { GraphiQL };
export default GraphiQL;
