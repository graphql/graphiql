/* eslint-disable import-x/no-unresolved */
import JsonWorker from 'https://esm.sh/monaco-editor/esm/vs/language/json/json.worker.js?worker';
import GraphQLWorker from 'https://esm.sh/monaco-graphql/esm/graphql.worker.js?worker';
import EditorWorker from 'https://esm.sh/monaco-editor/esm/vs/editor/editor.worker.js?worker';

globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    // eslint-disable-next-line no-console
    console.info('setup-workers/esm.sh', { label });
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql':
        return new GraphQLWorker();
    }
    return new EditorWorker();
  },
};
