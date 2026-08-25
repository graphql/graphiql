/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import type * as monaco from './monaco-editor';
import { ICreateData } from './typings';

// @ts-expect-error
import { initialize } from 'monaco-editor/editor/editor.worker';

import { GraphQLWorker } from './GraphQLWorker';

// monaco-editor >= 0.53 replaced the worker RPC bootstrap: the client now
// sends a throwaway "ping" message immediately followed by the real
// `$initialize` handshake. Wrapping `initialize()` in an extra
// `onmessage` handler (as this used to) consumes the ping and only calls
// `initialize()` on the *next* message, i.e. the real handshake, one
// message too late for its reply to reach the client — every RPC call
// then hangs forever waiting on a handshake that already happened.
// `monaco-editor/editor/editor.worker`'s own bootstrap calls `initialize`
// unwrapped for the same reason; mirror that here.
initialize(
  (ctx: monaco.worker.IWorkerContext, createData: ICreateData) =>
    new GraphQLWorker(ctx, createData),
);
