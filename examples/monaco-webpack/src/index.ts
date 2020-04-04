import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'regenerator-runtime/runtime';
import 'monaco-graphql/esm/monaco.contribution';

// NOTE: using loader syntax becuase Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// @ts-ignore
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
// @ts-ignore
import GraphQLWorker from 'worker-loader!monaco-graphql/esm/graphql.worker';

// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphqlDev') {
      return new GraphQLWorker();
    }
    if (label === 'json') {
      return new JSONWorker();
    }
    return new EditorWorker();
  },
};

// monaco.editor.create(document.getElementById('root-below') as HTMLElement, {
//   value: `{ "example": "example" }`,
//   language: "json"
// });

const model = monaco.editor.createModel(
  `
query Example { 
  allFilms {
      films {
          id
      }
  }
}
`,
  'graphqlDev',
  monaco.Uri.file('/1.graphql'),
);

monaco.editor.create(document.getElementById('root') as HTMLElement, {
  model,
});
