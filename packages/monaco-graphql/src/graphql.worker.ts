import * as monaco from 'monaco-editor';
// @ts-ignore
import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { GraphQLWorker, ICreateData } from './graphqlWorker';

self.onmessage = () => {
  console.log('self.onmessage');
  try {
    // ignore the first message
    worker.initialize(
      (ctx: monaco.worker.IWorkerContext, createData: ICreateData) => {
        console.log('worker initialized');
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    console.error(err);
    throw err;
  }
};
