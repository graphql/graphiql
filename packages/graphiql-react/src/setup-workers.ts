// eslint-disable-next-line import-x/default
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
// eslint-disable-next-line import-x/default
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker';

globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    console.info('setup-workers', { label });
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql': {
        return new GraphQLWorker();
      }
    }
    return new EditorWorker();
  },
};
