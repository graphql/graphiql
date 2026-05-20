/**
 * CDN-targeted Monaco worker setup. Workers are inlined as blob URLs
 * (Vite's `?worker&inline`) so the spawning page can be any origin: there
 * is no cross-origin `new Worker(url)` to fail.
 *
 * Equivalent to `@graphiql/react/setup-workers/vite`, but with `&inline`
 * because the consumer-side bundler isn't in the picture.
 */
/* eslint-disable import-x/default -- false positive */
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker&inline';
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker&inline';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&inline';

globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql':
        return new GraphQLWorker();
    }
    return new EditorWorker();
  },
};
