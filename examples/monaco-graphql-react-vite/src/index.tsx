/* eslint-disable import-x/default */
import { createRoot } from 'react-dom/client';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import TSWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker';
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker';
import Editor from './editor';
import './globals.css';

/**
 * Setup Monaco Editor workers for Vite.
 *
 * Vite doesn’t support instantiating web workers directly from bare module imports like this:
 * ```
 * new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url))
 * ```
 * Vite needs to know ahead of time that you are loading a web worker.
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    console.info('setup-workers/vite', { label });
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql':
        return new GraphQLWorker();
      case 'typescript':
        return new TSWorker();
    }
    return new EditorWorker();
  },
};

const root = createRoot(document.getElementById('root')!);
root.render(<Editor />);
