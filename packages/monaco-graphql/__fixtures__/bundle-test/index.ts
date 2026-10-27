import JsonWorker from 'monaco-editor/languages/features/json/json.worker.js?worker';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker';
import 'monaco-graphql';

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
