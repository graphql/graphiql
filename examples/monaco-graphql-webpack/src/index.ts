/* global netlify */

import * as monaco from 'monaco-editor';
import { init } from 'monaco-graphql';

// NOTE: using loader syntax becuase Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
// @ts-ignore
import JSONWorker from 'worker-loader!monaco-editor/esm/vs/language/json/json.worker';
// @ts-ignore
import GraphQLWorker from 'worker-loader!monaco-graphql/esm/graphql.worker';

import { LanguageServiceAPI } from 'monaco-graphql/src/api';

const SCHEMA_URL = 'https://api.github.com/graphql';

const SITE_ID = '46a6b3c8-992f-4623-9a76-f1bd5d40505c';
let API_TOKEN = localStorage.getItem('ghapi') || null;

let isLoggedIn = false;

const GRAPHQL_LANGUAGE_ID = 'graphql';

// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === GRAPHQL_LANGUAGE_ID) {
      return new GraphQLWorker();
    }
    if (label === 'json') {
      return new JSONWorker();
    }
    return new EditorWorker();
  },
};

const operationString = `
# right click to view context menu
# F1 for command palette
# enjoy prettier formatting, autocompletion,
# validation, hinting and more for GraphQL SDL and operations!

query Example(
  $owner: String!
  $name: String!
  $reviewEvent: PullRequestReviewEvent!
  $user: FollowUserInput!
) {
  repository(owner: $owner, name: $name) {
    stargazerCount
  }
}
`;

const variablesString = `{ 
  "reviewEvent": "graphql", 
  "name": true
}`;

const THEME = 'vs-dark';

/**
 * load local schema by default
 */
(async () => {
  const GraphQLAPI = await init({
    schemaConfig: {
      uri: SCHEMA_URL,
      requestOpts: {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      },
    },
  });
  await render(GraphQLAPI);
})();

async function render(GraphQLAPI: LanguageServiceAPI) {
  const toolbar = document.getElementById('toolbar');
  if (!isLoggedIn && !API_TOKEN) {
    const githubButton = document.createElement('button');

    githubButton.id = 'login';
    githubButton.innerHTML = 'GitHub Login for <pre>monaco-graphql</pre> Demo';

    githubButton.onclick = e => {
      e.preventDefault();
      // @ts-ignore
      const authenticator = new netlify.default({ site_id: SITE_ID });
      authenticator.authenticate(
        { provider: 'github', scope: ['user', 'read:org'] },
        async (err: Error, data: { token: string }) => {
          if (err) {
            console.error('Error Authenticating with GitHub: ' + err);
          } else {
            isLoggedIn = true;
            API_TOKEN = data.token;
            localStorage.setItem('ghapi', data.token);
            await render(GraphQLAPI);
          }
        },
      );
    };
    toolbar?.appendChild(githubButton);
    return;
  } else {
    if (toolbar) {
      const schemaLoader = document.createElement('span');
      const getLoaderHTML = (message: string) =>
        `<small style="color: #eee; margin-right: 4px;">${message}</small>`;
      schemaLoader.innerHTML = getLoaderHTML('Schema Loading...');

      GraphQLAPI.onSchemaLoaded(() => {
        schemaLoader.innerHTML = getLoaderHTML('Schema Loaded.');
      });

      const button = document.createElement('button');

      button.id = 'button';
      button.innerText = 'Run Operation ➤';

      button.onclick = () => executeCurrentOp();
      button.ontouchend = () => executeCurrentOp();
      toolbar.innerHTML = '';
      toolbar.appendChild(schemaLoader);
      toolbar?.appendChild(button);
    }
  }

  /**
   * Creating & configuring the editor panes
   */

  const variablesModel = monaco.editor.createModel(
    variablesString,
    'json',
    monaco.Uri.file('/1/variables.json'),
  );

  const variablesSchemaUri = monaco.Uri.file('/1/variables-schema.json');

  const variablesEditor = monaco.editor.create(
    document.getElementById('variables') as HTMLElement,
    {
      model: variablesModel,
      language: 'json',
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      theme: THEME,
    },
  );

  const resultsEditor = monaco.editor.create(
    document.getElementById('results') as HTMLElement,
    {
      value: `{}`,
      language: 'json',
      automaticLayout: true,
      theme: THEME,
      wordWrap: 'on',
    },
  );

  const operationModel = monaco.editor.createModel(
    operationString,
    GRAPHQL_LANGUAGE_ID,
    monaco.Uri.file('/1/operation.graphql'),
  );

  const operationEditor = monaco.editor.create(
    document.getElementById('operation') as HTMLElement,
    {
      model: operationModel,
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      theme: THEME,
      language: GRAPHQL_LANGUAGE_ID,
    },
  );
  /**
   * API Usage!!
   */

  async function updateVariables() {
    const jsonSchema = await GraphQLAPI.getVariablesJSONSchema(
      operationModel.getValue(),
    );
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemaValidation: 'error',
      schemas: [
        {
          uri: variablesSchemaUri.toString(),
          fileMatch: [variablesModel.uri.toString()],
          schema: jsonSchema,
        },
      ],
    });
  }

  await updateVariables();

  operationEditor.onDidChangeModelContent(async _event => {
    await updateVariables();
  });

  /**
   * Configure monaco-graphql formatting operations
   */

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
      // parse the variables so we can detect if we need to send any
      const parsedVariables = JSON.parse(variables);
      if (parsedVariables && Object.keys(parsedVariables).length) {
        body.variables = variables;
      }
      const result = await fetch(GraphQLAPI.schemaConfig.uri || SCHEMA_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const resultText = await result.text();
      resultsEditor.setValue(JSON.stringify(JSON.parse(resultText), null, 2));
    } catch (err) {
      // set the error to results
      // @ts-ignore
      resultsEditor.setValue(err.toString());
    }
  }

  /**
   * Add an operation to the command palette & keyboard shortcuts
   */
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
}
