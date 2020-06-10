/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type { worker as WorkerNamespace } from 'monaco-editor';
import { ICreateData } from './typings';

// @ts-ignore
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';

import { GraphQLWorker } from './GraphQLWorker';

self.onmessage = () => {
  try {
    worker.initialize(
      (ctx: WorkerNamespace.IWorkerContext, createData: ICreateData) => {
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    throw err;
  }
};
