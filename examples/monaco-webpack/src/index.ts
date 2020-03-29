import * as monaco from 'monaco-editor';
import 'regenerator-runtime/runtime';
import 'monaco-graphql/esm/monaco.contribution';

// @ts-ignore
self.MonacoEnvironment = {
  getWorkerUrl: (_moduleId: string, label: string) => {
    if (label === 'json') {
      return './json.worker.js';
    }
    if (label === 'graphql') {
      return './graphql.worker.js';
    }
    return './editor.worker.js';
  },
  getWorker: (_moduleId: string, label: string) => {
    if (label === 'json') {
      return new Worker('./json.worker.js');
    }
    if (label === 'graphql') {
      return new Worker('./graphql.worker.js');
    }
    return new Worker('./editor.worker.js');
  },
};

// monaco.editor.create(document.getElementById('root-below') as HTMLElement, {
//   value: `{ "example": "example" }`,
//   language: "json"
// });

const model = monaco.editor.createModel(`query Example { id }`, 'graphql');

monaco.editor.create(document.getElementById('root') as HTMLElement, {
  model,
});
