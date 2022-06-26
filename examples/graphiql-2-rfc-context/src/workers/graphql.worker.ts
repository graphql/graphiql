/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type { worker as WorkerNamespace } from 'monaco-editor';

// @ts-expect-error
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';

import type { ICreateData } from 'monaco-graphql/esm/typings';

import { GraphQLWorker } from 'monaco-graphql/esm/GraphQLWorker';

self.onmessage = () => {
  // ignore the first message
  worker.initialize(
    (ctx: WorkerNamespace.IWorkerContext, createData: ICreateData) =>
      new GraphQLWorker(ctx, createData),
  );
};
