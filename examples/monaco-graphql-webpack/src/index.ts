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

const SCHEMA_URL = 'https://swapi-graphql.netlify.app/.netlify/functions/index';

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

// const schemaInput = document.createElement('input');
// schemaInput.type = 'text'

// // @ts-ignore
// schemaInput.value = SCHEMA_URL

// schemaInput.onchange = (e) => {
//   e.preventDefault()
//   console.log(e.target.value)
// }

// const toolbar = document.getElementById('toolbar')
// toolbar?.appendChild(schemaInput)

const variablesModel = monaco.editor.createModel(
  `{}`,
  'json',
  monaco.Uri.file('/1/variables.json'),
);

const resultsEditor = monaco.editor.create(
  document.getElementById('results') as HTMLElement,
  {
    model: variablesModel,
  },
);
const variablesEditor = monaco.editor.create(
  document.getElementById('variables') as HTMLElement,
  {
    value: `{ }`,
    language: 'json',
  },
);
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
  monaco.Uri.file('/1/operation.graphql'),
);

const operationEditor = monaco.editor.create(
  document.getElementById('operation') as HTMLElement,
  {
    model,
  },
);

/**
 * Basic Operation Exec Example
 */

async function executeCurrentOp() {
  try {
    const operation = operationEditor.getValue();
    const variables = variablesEditor.getValue();
    const body: { variables?: string; query: string } = { query: operation };
    const parsedVariables = JSON.parse(variables);
    if (parsedVariables && Object.keys(parsedVariables).length) {
      body.variables = variables;
    }
    const result = await fetch(SCHEMA_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const resultText = await result.text();
    resultsEditor.setValue(JSON.stringify(JSON.parse(resultText), null, 2));
  } catch (err) {
    resultsEditor.setValue(err.toString());
  }
}

const opAction: monaco.editor.IActionDescriptor = {
  id: 'graphql-run',
  label: 'Run Operation',
  contextMenuOrder: 0,
  contextMenuGroupId: 'graphql',
  keybindings: [
    // eslint-disable-next-line no-bitwise
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
  ],
  run: executeCurrentOp,
};

operationEditor.addAction(opAction);
variablesEditor.addAction(opAction);
resultsEditor.addAction(opAction);

// add your own diagnostics? why not!
// monaco.editor.setModelMarkers(
//   model,
//   'graphql',
//   [{
//     severity: 5,
//     message: 'An example diagnostic error',
//     startColumn: 2,
//     startLineNumber: 4,
//     endLineNumber: 4,
//     endColumn: 0,
//   }],
// );
