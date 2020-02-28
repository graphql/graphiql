import * as worker from 'monaco-editor-core/esm/vs/editor/editor.worker';
import { JSONWorker } from './jsonWorker';

self.onmessage = () => {
  // ignore the first message
  worker.initialize((ctx, createData) => {
    return new JSONWorker(ctx, createData);
  });
};
