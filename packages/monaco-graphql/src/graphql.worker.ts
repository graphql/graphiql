// @ts-ignore
import { worker } from 'monaco-editor-core';
import { GraphQLWorker } from './graphqlWorker';

self.onmessage = () => {
  // ignore the first message
  // @ts-ignore
  worker.initialize((ctx: worker.IWorkerContext<undefined>, createData) => {
    return new GraphQLWorker(ctx, createData);
  });
};
