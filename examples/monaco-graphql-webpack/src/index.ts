import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { api as GraphQLAPI } from 'monaco-graphql';

// NOTE: using loader syntax becuase Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// @ts-ignore
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
// @ts-ignore
import GraphQLWorker from 'worker-loader!monaco-graphql/esm/graphql.worker';

const SCHEMA_URL = 'https://api.spacex.land/graphql/';

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

const op = `
query Example($limit: Int) {
  launchesPast(limit: $limit) {
    mission_name
    # format me using the right click context menu
              launch_date_local
    launch_site {
      site_name_long
    }
    links {
      article_link
      video_link
    }
  }
}
  `;
const variables = `{ "limit": 10 }`;

const THEME = 'vs-dark';

const schemaInput = document.createElement('input');
schemaInput.type = 'text';

schemaInput.value = SCHEMA_URL;

const button = document.createElement('button');

button.id = 'button';
button.innerText = 'Run';

button.onclick = () => executeCurrentOp();
button.ontouchend = () => executeCurrentOp();

schemaInput.onkeyup = e => {
  e.preventDefault();
  // @ts-ignore
  const val = e?.target?.value as string;
  if (val && typeof val === 'string') {
    GraphQLAPI.setSchemaConfig({ uri: val });
  }
};

const toolbar = document.getElementById('toolbar');
toolbar?.appendChild(schemaInput);
toolbar?.appendChild(button);

const variablesModel = monaco.editor.createModel(
  `{}`,
  'json',
  monaco.Uri.file('/1/variables.json'),
);

const resultsEditor = monaco.editor.create(
  document.getElementById('results') as HTMLElement,
  {
    model: variablesModel,
    automaticLayout: true,
    theme: THEME,
  },
);
const variablesEditor = monaco.editor.create(
  document.getElementById('variables') as HTMLElement,
  {
    value: `{ "limit": 10 }`,
    language: 'json',
    automaticLayout: true,
    theme: THEME,
  },
);
const model = monaco.editor.createModel(
  `
query Example($limit: Int) {
  launchesPast(limit: $limit) {
    mission_name
    # format me using the right click context menu
              launch_date_local
    launch_site {
      site_name_long
    }
    links {
      article_link
      video_link
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
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    folding: true,
    theme: THEME,
  },
);

GraphQLAPI.setFormattingOptions({
  prettierConfig: {
    printWidth: 120,
  },
});

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
    const result = await fetch(GraphQLAPI.schemaConfig.uri || SCHEMA_URL, {
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
  contextMenuGroupId: 'operation',
  keybindings: [
    // eslint-disable-next-line no-bitwise
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
  ],
  run: executeCurrentOp,
};

variablesEditor.setValue(variables);
operationEditor.setValue(op);

operationEditor.addAction(opAction);
variablesEditor.addAction(opAction);
resultsEditor.addAction(opAction);

/**
 * load local schema by default
 */

let initialSchema = false;

if (!initialSchema) {
  GraphQLAPI.setSchemaConfig({ uri: SCHEMA_URL });
  initialSchema = true;
}

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
