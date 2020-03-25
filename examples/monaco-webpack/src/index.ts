import * as monaco from 'monaco-editor';
import 'regenerator-runtime/runtime';
import 'monaco-graphql/esm/monaco.contribution';

// @ts-ignore
self.MonacoEnvironment = {
  getWorkerUrl: (_moduleId: string, label: string) => {
    console.log({ _moduleId, label });
    if (label === 'json') {
      return './json.worker.js';
    }
    if (label === 'graphql') {
      return './graphql.worker.js';
    }
    return './editor.worker.js';
  },
};

monaco.editor.create(document.getElementById('root-below') as HTMLElement, {
  value: `{ "example": "example" }`,
  language: 'json',
});

monaco.editor.create(document.getElementById('root') as HTMLElement, {
  value: `query Example { id }`,
  language: 'graphql',
});
