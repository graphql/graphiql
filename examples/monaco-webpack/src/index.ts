import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'regenerator-runtime/runtime';
import 'monaco-graphql/esm/monaco.contribution';
import * as prettierStandalone from 'prettier/standalone';
import * as prettierGraphqlParser from 'prettier/parser-graphql';
// NOTE: using loader syntax becuase Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// @ts-ignore
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
// @ts-ignore
import GraphQLWorker from 'worker-loader!monaco-graphql/esm/graphql.worker';

const SCHEMA_URL = 'https://swapi-graphql.netlify.com/.netlify/functions/index';
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

const resultsEditor = monaco.editor.create(
  document.getElementById('results') as HTMLElement,
  {
    value: `{ }`,
    language: 'json',
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
  monaco.Uri.file('/1.graphql'),
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

const opAction = {
  id: 'run',
  label: 'Run Operation',
  keybindings: [
    // eslint-disable-next-line no-bitwise
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    // eslint-disable-next-line no-bitwise
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
    // eslint-disable-next-line no-bitwise
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_R,
    // eslint-disable-next-line no-bitwise
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_Q,
  ],
  run: executeCurrentOp,
};

operationEditor.addAction(opAction);
variablesEditor.addAction(opAction);
resultsEditor.addAction(opAction);

/**
 * Basic custom formatter/language functionality example
 */

monaco.languages.registerDocumentFormattingEditProvider('graphqlDev', {
  provideDocumentFormattingEdits: (
    document: monaco.editor.ITextModel,
    _options: monaco.languages.FormattingOptions,
    _token: monaco.CancellationToken,
  ) => {
    const text = document.getValue();
    const formatted = prettierStandalone.format(text, {
      parser: 'graphql',
      plugins: [prettierGraphqlParser],
    });
    return [
      {
        range: document.getFullModelRange(),
        text: formatted,
      },
    ];
  },
});
