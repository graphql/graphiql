/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type * as monaco from './monaco-editor';
import { ICreateData } from './typings';

// @ts-expect-error - monaco-editor 内部モジュール
import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker';

import { GraphQLWorker } from './GraphQLWorker';

// monaco-editor 0.53+ の新しい Worker 初期化パターン
// initialize() は self.onmessage を設定し、最初のメッセージで
// コールバックを呼び出す（m.data が createData として渡される）
initialize(
  (ctx: monaco.worker.IWorkerContext, createData?: ICreateData) =>
    new GraphQLWorker(ctx, createData),
);
