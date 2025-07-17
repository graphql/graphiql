import createJSONWorker from 'https://esm.sh/monaco-editor/esm/vs/language/json/json.worker.js?worker';
import createGraphQLWorker from 'https://esm.sh/monaco-graphql/esm/graphql.worker.js?worker';
import createEditorWorker from 'https://esm.sh/monaco-editor/esm/vs/editor/editor.worker.js?worker';

globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    console.info('MonacoEnvironment.getWorker', { label });
    switch (label) {
      case 'json':
        return createJSONWorker();
      case 'graphql':
        return createGraphQLWorker();
    }
    return createEditorWorker();
  },
};
