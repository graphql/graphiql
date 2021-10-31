/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type { worker as WorkerNamespace } from 'monaco-editor';
import { ICreateData } from './typings';

// @ts-ignore
import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker.js';

import { GraphQLWorker } from './GraphQLWorker';

self.onmessage = () => {
  try {
    initialize(
      (ctx: WorkerNamespace.IWorkerContext, createData: ICreateData) => {
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    throw err;
  }
};
