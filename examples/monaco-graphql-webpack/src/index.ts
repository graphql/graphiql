/* global monaco */

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

const schemas = {
  remote: {
    op: `
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
    variables: `{ "limit": 10 }`,
    load: ({ op, variables }: { op: string; variables: string }) => {
      GraphQLAPI.setSchemaConfig({ uri: SCHEMA_URL });
      variablesEditor.setValue(variables);
      operationEditor.setValue(op);
    },
  },
  local: {
    op: `query Example {
  allTodos {
    id
    name
  }
}`,
    load: ({ op }: { op: string }) => {
      setRawSchema();
      variablesEditor.setValue('{}');
      operationEditor.setValue(op);
    },
  },
};

const THEME = 'vs-dark';

const schemaInput = document.createElement('input');
schemaInput.type = 'text';

schemaInput.value = SCHEMA_URL;

const selectEl = document.createElement('select');

selectEl.onchange = e => {
  e.preventDefault();
  const type = selectEl.value as 'local' | 'remote';
  if (schemas[type]) {
    // @ts-ignore
    schemas[type].load(schemas[type]);
  }
};

const createOption = (label: string, value: string) => {
  const el = document.createElement('option');
  el.label = label;
  el.value = value;
  return el;
};

selectEl.appendChild(createOption('Remote', 'remote'));
selectEl.appendChild(createOption('Local', 'local'));

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
toolbar?.appendChild(selectEl);

async function setRawSchema() {
  await GraphQLAPI.setSchema(`# Enumeration type for a level of priority
  enum Priority {
    LOW
    MEDIUM
    HIGH
  }

  # Our main todo type
  type Todo {
    id: ID!
    name: String!
    description: String
    priority: Priority!
  }

  type Query {
    # Get one todo item
    todo(id: ID!): Todo
    # Get all todo items
    allTodos: [Todo!]!
  }

  type Mutation {
    addTodo(name: String!, priority: Priority = LOW): Todo!
    removeTodo(id: ID!): Todo!
  }

  schema {
    query: Query
    mutation: Mutation
  }`);
}

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

operationEditor.addAction(opAction);
variablesEditor.addAction(opAction);
resultsEditor.addAction(opAction);

/**
 * load local schema by default
 */

let initialSchema = false;

if (!initialSchema) {
  schemas.remote.load(schemas.remote);
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
