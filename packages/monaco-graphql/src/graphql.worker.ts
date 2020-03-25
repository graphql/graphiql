import * as monaco from 'monaco-editor-core';
import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { GraphQLWorker, ICreateData } from './graphqlWorker';
console.log('initialize the worker 1');

self.onmessage = () => {
  console.log('initialize the worker 2', worker);
  try {
    // ignore the first message
    worker.initialize(
      (
        ctx: monaco.worker.IWorkerContext<undefined>,
        createData: ICreateData,
      ) => {
        console.log('initialize the worker 3');
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    throw err;
  }
};
