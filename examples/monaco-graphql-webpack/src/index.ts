/* global netlify */

import * as monaco from 'monaco-editor';
import * as JSONC from 'jsonc-parser';
import { initialize } from 'monaco-graphql';
import type { MonacoGraphQLAPI } from 'monaco-graphql';

import { createEditors } from './editors';

import './style.css';

const SCHEMA_URL = 'https://api.github.com/graphql';

const SITE_ID = '46a6b3c8-992f-4623-9a76-f1bd5d40505c';
let API_TOKEN = localStorage.getItem('ghapi') || null;

let isLoggedIn = false;

const schemaOptions = [
  {
    value: SCHEMA_URL,
    label: 'Github API',
    default: true,
  },
  {
    value: 'https://api.spacex.land/graphql',
    label: 'SpaceX GraphQL API',
  },
];

/**
 * load github schema by default
 */
(async () => {
  const api = await initialize({
    schemaConfig: {
      uri: SCHEMA_URL,
      requestOpts: {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      },
    },
  });
  await render(api);
})();

async function render(monacoGraphQLAPI: MonacoGraphQLAPI) {
  /**
   * Configure monaco-graphql prettier instance
   */
  monacoGraphQLAPI.setFormattingOptions({
    prettierConfig: {
      printWidth: 120,
    },
  });

  /**
   * Schema status
   */

  monacoGraphQLAPI.onSchemaLoaded(() => {
    setSchemaStatus('Schema Loaded.');
  });

  monacoGraphQLAPI.onSchemaConfigChange(() => {
    setSchemaStatus('Schema Loading....');
  });

  if (!isLoggedIn && !API_TOKEN) {
    renderGithubLoginButton(monacoGraphQLAPI);
    return;
  } else {
    const toolbar = document.getElementById('toolbar')!;
    const editors = createEditors();
    const {
      operationModel,
      operationEditor,
      variablesEditor,
      resultsEditor,
      variablesModel,
    } = editors;
    const { schemaReloadButton, executeOpButton, schemaPicker } = renderToolbar(
      toolbar,
    );

    /**
     * Choosing a new schema
     */
    schemaPicker.addEventListener('input', function SchemaSelectionHandler(
      _ev: Event,
    ) {
      if (schemaPicker.value !== monacoGraphQLAPI.schemaConfig.uri) {
        monacoGraphQLAPI.setSchemaUri(schemaPicker.value);
        setSchemaStatus('Schema Loading...');
      }
    });

    /**
     * Reloading your schema
     */
    schemaReloadButton.addEventListener('click', async () => {
      setSchemaStatus('Schema Loading...');
      await monacoGraphQLAPI.reloadSchema();
    });

    const variablesSchemaUri = monaco.Uri.file('/1/variables-schema.json');

    /**
     * VARIABLES JSON LANGUAGE FEATURES!!!!
     */

    // eslint-disable-next-line no-inner-declarations
    async function updateVariables() {
      // get the variables JSONSchema from the operationModel value
      const jsonSchema = await monacoGraphQLAPI.getVariablesJSONSchema(
        operationModel.uri.toString(),
        operationModel.getValue(),
      );
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemaValidation: 'error',
        allowComments: true,
        schemas: [
          {
            // just make sure this is unique for each operation.
            // monaco can handle many models at once
            uri: variablesSchemaUri.toString(),
            // this should ensure that it only matches the current json model
            fileMatch: [variablesModel.uri.toString()],
            schema: jsonSchema,
          },
        ],
      });
    }

    // this ensures that the variables JSON support reloads when the schema changes
    monacoGraphQLAPI.onSchemaLoaded(async () => {
      await updateVariables();
      // and... every time the operation changes? or maybe debounce it?
      // might need to make this an internal part of languageFeatures.ts
      operationEditor.onDidChangeModelContent(async _event => {
        await updateVariables();
      });
    });

    /**
     * Execute GraphQL operations, for reference!
     * monaco-graphql itself doesn't do anything with handling operations yet, but it may soon!
     */

    const getOperationHandler = (api: MonacoGraphQLAPI) => {
      return async () => {
        try {
          const operation = operationEditor.getValue();
          const variables = variablesEditor.getValue();
          const body: { variables?: string; query: string } = {
            query: operation,
          };
          // parse the variables with JSONC so we can have comments!
          const parsedVariables = JSONC.parse(variables);
          if (parsedVariables && Object.keys(parsedVariables).length) {
            body.variables = JSON.stringify(parsedVariables, null, 2);
          }
          const result = await fetch(api.schemaConfig.uri as string, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...api?.schemaConfig?.requestOpts?.headers,
            },
            body: JSON.stringify(body, null, 2),
          });

          const resultText = await result.text();
          resultsEditor.setValue(
            JSON.stringify(JSON.parse(resultText), null, 2),
          );
        } catch (err) {
          if (err instanceof Error) {
            resultsEditor.setValue(err.toString());
          }
        }
      };
    };

    const operationHandler = getOperationHandler(monacoGraphQLAPI);

    executeOpButton.addEventListener('click', operationHandler);
    executeOpButton.addEventListener('touchend', operationHandler);

    /**
     * Add an editor operation to the command palette & keyboard shortcuts
     */
    const opAction: monaco.editor.IActionDescriptor = {
      id: 'graphql-run',
      label: 'Run Operation',
      contextMenuOrder: 0,
      contextMenuGroupId: 'graphql',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      ],
      run: operationHandler,
    };

    /**
     * Add an reload operation to the command palette & keyboard shortcuts
     */
    const reloadAction: monaco.editor.IActionDescriptor = {
      id: 'graphql-reload',
      label: 'Reload Schema',
      contextMenuOrder: 0,
      contextMenuGroupId: 'graphql',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_R,
      ],
      run: operationHandler,
    };

    operationEditor.addAction(opAction);
    variablesEditor.addAction(opAction);
    resultsEditor.addAction(opAction);
    operationEditor.addAction(reloadAction);
  }
}

// RENDERING - All the irrelevant vanillajs code you don't want to see

const setSchemaStatus = (message: string) => {
  const schemaStatus = document.getElementById('schema-status');
  if (schemaStatus) {
    const html = `<small>${message}</small>`;
    schemaStatus.innerHTML = html;
  }
};

function renderToolbar(toolbar: HTMLElement) {
  toolbar.innerHTML = '';

  const schemaStatus = document.createElement('span');
  const schemaReloadButton = document.createElement('button');
  const executeOpButton = document.createElement('button');
  const schemaPicker = getSchemaPicker();
  const executionTray = document.createElement('div');

  executionTray.id = 'execution-tray';
  executionTray.appendChild(executeOpButton);
  executionTray.classList.add('align-right');

  executeOpButton.id = 'execute-op';
  executeOpButton.innerText = 'Run Operation ➤';
  executeOpButton.title = 'Execute the active GraphQL Operation';

  schemaReloadButton.classList.add('reload-button');
  schemaReloadButton.innerHTML = '🔄';
  schemaReloadButton.title = 'Reload the graphql schema';

  schemaStatus.id = 'schema-status';
  schemaStatus.innerHTML = `<small>Schema Empty</small>`;
  schemaStatus.classList.add('button');

  toolbar.appendChild(schemaPicker);

  toolbar.appendChild(schemaReloadButton);
  toolbar.appendChild(schemaStatus);

  toolbar?.appendChild(executionTray);
  return { schemaReloadButton, executeOpButton, schemaStatus, schemaPicker };
}

function getSchemaPicker(): HTMLSelectElement {
  const schemaPicker = document.createElement('select');
  schemaPicker.id = 'schema-picker';

  schemaOptions.forEach(option => {
    const optEl = document.createElement('option');
    optEl.value = option.value;
    optEl.label = option.label;
    if (option.default) {
      optEl.selected = true;
    }
    schemaPicker.appendChild(optEl);
  });

  return schemaPicker;
}

export function renderGithubLoginButton(api: MonacoGraphQLAPI) {
  const githubButton = document.createElement('button');

  githubButton.id = 'login';
  githubButton.innerHTML = 'GitHub Login for <pre>monaco-graphql</pre> Demo';

  githubButton.onclick = e => {
    e.preventDefault();
    // @ts-expect-error
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
          await render(api);
        }
      },
    );
  };
  const toolbar = document.getElementById('toolbar');
  toolbar?.appendChild(githubButton);
}
