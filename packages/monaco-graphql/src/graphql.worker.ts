import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { GraphQLWorker } from './graphqlWorker';

self.onmessage = () => {
  // ignore the first message
  worker.initialize((ctx: worker.IWorkerContext<undefined>, createData) => {
    return new GraphQLWorker(ctx, createData);
  });
};
