/* global netlify */

import * as monaco from 'monaco-editor';
import * as JSONC from 'jsonc-parser';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';

import { createEditors } from './editors';
import { schemaFetcher, schemaOptions } from './schema';
import './style.css';

const SITE_ID = '46a6b3c8-992f-4623-9a76-f1bd5d40505c';

(async () => {
  await render();
})();

async function render() {
  if (!schemaFetcher.token) {
    renderGithubLoginButton();
    return;
  } else {
    const monacoGraphQLAPI = initializeMode({
      formattingOptions: {
        prettierConfig: {
          printWidth: 120,
        },
      },
    });

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

    const operationUri = operationModel.uri.toString();

    const schema = await schemaFetcher.loadSchema();
    if (schema) {
      monacoGraphQLAPI.setSchemaConfig([
        { ...schema, fileMatch: [operationUri] },
      ]);
    }

    monacoGraphQLAPI.setDiagnosticSettings({
      validateVariablesJSON: {
        [operationUri]: [variablesModel.uri.toString()],
      },
      jsonDiagnosticSettings: {
        // jsonc tip!
        allowComments: true,
        schemaValidation: 'error',
        // this is nice too
        trailingCommas: 'warning',
      },
    });
    operationModel.onDidChangeContent(() => {
      setTimeout(() => {
        localStorage.setItem('operations', operationModel.getValue());
      }, 200);
    });
    variablesModel.onDidChangeContent(() => {
      setTimeout(() => {
        localStorage.setItem('variables', variablesModel.getValue());
      }, 200);
    });

    /**
     * Choosing a new schema
     */
    schemaPicker.addEventListener(
      'input',
      async function SchemaSelectionHandler(_ev: Event) {
        if (schemaPicker.value !== schemaFetcher.currentSchema.value) {
          const schemaResult = await schemaFetcher.changeSchema(
            schemaPicker.value,
          );
          if (schemaResult) {
            monacoGraphQLAPI.setSchemaConfig([
              {
                ...schemaResult,
                fileMatch: [operationModel.uri.toString()],
              },
            ]);
          }
        }
      },
    );

    /**
     * Reloading your schema
     */
    schemaReloadButton.addEventListener('click', () => {
      schemaFetcher.loadSchema().then();
    });

    /**
     * Execute GraphQL operations, for reference!
     * monaco-graphql itself doesn't do anything with handling operations yet, but it may soon!
     */

    const getOperationHandler = () => {
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
          const result = await fetch(
            schemaFetcher.currentSchema.value as string,
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...schemaFetcher.currentSchema?.headers,
              },
              body: JSON.stringify(body, null, 2),
            },
          );

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

    const operationHandler = getOperationHandler();

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

export function renderGithubLoginButton() {
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
          schemaFetcher.setApiToken(data.token);
          localStorage.setItem('ghapi', data.token);
          await render();
        }
      },
    );
  };
  const toolbar = document.getElementById('toolbar');
  toolbar?.appendChild(githubButton);
}
