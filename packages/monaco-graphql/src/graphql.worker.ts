/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type * as monaco from './monaco-editor';
import { ICreateData } from './typings';

// @ts-expect-error
import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker';

import { GraphQLWorker } from './GraphQLWorker';

self.onmessage = () => {
  initialize(
    (ctx: monaco.worker.IWorkerContext, createData: ICreateData) =>
      new GraphQLWorker(ctx, createData),
  );
};
