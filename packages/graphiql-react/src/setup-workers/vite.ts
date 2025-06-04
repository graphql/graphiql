/* eslint-disable import-x/default -- false positive */
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker';

/**
 * Setup Monaco Editor workers for Vite.
 * Vite needs to know ahead of time that you are loading a web worker.
 * Vite doesn’t support instantiating web workers directly from bare module imports like:
 *
 * ```js
 * new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url))
 * ```
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    // eslint-disable-next-line no-console
    console.info('setup-workers/vite', { label });
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql':
        return new GraphQLWorker();
    }
    return new EditorWorker();
  },
};
