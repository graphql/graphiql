/* global netlify */

import * as monaco from 'monaco-editor';
import * as JSONC from 'jsonc-parser';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';

import { createEditors } from './editors';
import { schemaFetcher, schemaOptions } from './schema';
import './style.css';
import type { MonacoGraphQLAPI } from 'monaco-graphql';

const SITE_ID = '46a6b3c8-992f-4623-9a76-f1bd5d40505c';

let monacoGraphQLAPI: MonacoGraphQLAPI | null = null;

void render();

async function render() {
  if (!schemaFetcher.token) {
    renderGithubLoginButton();

    return;
  }
  monacoGraphQLAPI ||= initializeMode({
    formattingOptions: {
      prettierConfig: {
        printWidth: 120,
      },
    },
  });

  document.getElementById('github-login-wrapper')?.remove();
  document
    .getElementById('session-editor')
    ?.setAttribute('style', 'display: flex');
  document
    .getElementById('toolbar')
    ?.setAttribute('style', 'display: inline-flex');

  const toolbar = document.getElementById('toolbar')!;
  const editors = createEditors();
  const {
    operationModel,
    operationEditor,
    variablesEditor,
    schemaEditor,
    resultsEditor,
    variablesModel,
    schemaModel,
  } = editors;
  const { schemaReloadButton, executeOpButton, schemaPicker } =
    renderToolbar(toolbar);

  renderGithubLoginButton();

  const operationUri = operationModel.uri.toString();

  const schema = await schemaFetcher.loadSchema();
  if (schema) {
    console.log('loaded schema', schema);
    monacoGraphQLAPI.setSchemaConfig([
      { ...schema, fileMatch: [operationUri, schemaModel.uri.toString()] },
    ]);

    schemaEditor.setValue(schema.documentString || '');
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
  schemaModel.onDidChangeContent(() => {
    setTimeout(async () => {
      const value = schemaModel.getValue();
      localStorage.setItem('schema-sdl', value);

      const nextSchema = await schemaFetcher.overrideSchema(value);

      if (nextSchema) {
        monacoGraphQLAPI?.setSchemaConfig([
          {
            ...nextSchema,
            fileMatch: [operationUri, schemaModel.uri.toString()],
          },
        ]);
      }
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
        if (schemaResult && monacoGraphQLAPI) {
          monacoGraphQLAPI.setSchemaConfig([
            {
              ...schemaResult,
              fileMatch: [operationModel.uri.toString()],
            },
          ]);
          schemaEditor.setValue(schemaResult.documentString || '');
        }
      }
    },
  );

  /**
   * Reloading your schema
   */
  schemaReloadButton.addEventListener('click', async () => {
    const schemaResult = await schemaFetcher.loadSchema();
    if (schemaResult) {
      schemaEditor.setValue(schemaResult.documentString || '');
    }
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
        // parse the variables with JSONC, so we can have comments!
        const parsedVariables = JSONC.parse(variables);
        if (parsedVariables && Object.keys(parsedVariables).length) {
          body.variables = JSON.stringify(parsedVariables, null, 2);
        }
        const result = await fetch(schemaFetcher.currentSchema.value, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...schemaFetcher.currentSchema?.headers,
          },
          body: JSON.stringify(body, null, 2),
        });

        const resultText = await result.text();
        resultsEditor.setValue(JSON.stringify(JSON.parse(resultText), null, 2));
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
      monaco.KeyMod.CtrlCmd | monaco.KeyCode?.KeyR, // eslint-disable-line no-bitwise
    ],
    run: async () => {
      await schemaFetcher.loadSchema();
    },
  };

  operationEditor.addAction(opAction);
  variablesEditor.addAction(opAction);
  resultsEditor.addAction(opAction);
  operationEditor.addAction(reloadAction);
}

function renderToolbar(toolbar: HTMLElement) {
  toolbar.innerHTML = '';

  const schemaStatus = document.createElement('div');
  const schemaReloadButton = document.createElement('button');
  const executeOpButton = document.createElement('button');
  const schemaPicker = getSchemaPicker();
  const executionTray = document.createElement('div');

  executionTray.id = 'execution-tray';
  executionTray.append(executeOpButton);
  executionTray.classList.add('align-right');

  executeOpButton.id = 'execute-op';
  executeOpButton.innerText = 'Run Operation ➤';
  executeOpButton.title = 'Execute the active GraphQL Operation';

  schemaReloadButton.classList.add('reload-button');
  schemaReloadButton.innerHTML = '🔄';
  schemaReloadButton.title = 'Reload the graphql schema';

  schemaStatus.id = 'schema-status';
  schemaStatus.innerHTML = `Schema Empty`;

  toolbar.append(
    schemaPicker,
    schemaReloadButton,
    schemaStatus,
    executeOpButton,
  );
  return { schemaReloadButton, executeOpButton, schemaStatus, schemaPicker };
}

function getSchemaPicker(): HTMLSelectElement {
  const schemaPicker = document.createElement('select');
  schemaPicker.id = 'schema-picker';

  for (const option of schemaOptions) {
    const optEl = document.createElement('option');
    optEl.value = option.value;
    optEl.label = option.label;
    if (option.default) {
      optEl.selected = true;
    }
    schemaPicker.append(optEl);
  }

  return schemaPicker;
}

/**
 * login using the provided netlify API for oauth
 */
export function renderGithubLoginButton() {
  const githubLoginWrapper = document.createElement('div');
  githubLoginWrapper.id = 'github-login-wrapper';
  githubLoginWrapper.innerHTML = `<p>Using Netlify's OAuth client to retrieve your token, you'll see a simple github graphql <code>monaco-graphql</code> Demo.</p>`;
  const githubButton = document.createElement('button');

  const logoutButton = document.createElement('button');

  logoutButton.innerHTML = 'Logout';

  logoutButton.onclick = async e => {
    e.preventDefault();
    schemaFetcher.logout();
    await render();
    document
      .getElementById('session-editor')
      ?.setAttribute('style', 'display: none');
    document.getElementById('toolbar')?.setAttribute('style', 'display: none');
  };

  if (schemaFetcher.token) {
    document.getElementById('github-login-wrapper')?.remove();
    const toolbar = document.getElementById('toolbar');
    toolbar?.appendChild(logoutButton);
  } else {
    githubLoginWrapper.append(githubButton);
    document.getElementById('flex-wrapper')?.prepend(githubLoginWrapper);
  }

  githubButton.id = 'login';
  githubButton.innerHTML = 'GitHub Login';

  githubButton.onclick = e => {
    e.preventDefault();
    // @ts-expect-error
    const authenticator = new netlify.default({ site_id: SITE_ID });
    authenticator.authenticate(
      { provider: 'github', scope: ['user'] },
      async (err: Error, data: { token: string }) => {
        if (err) {
          console.error('Error authenticating with GitHub:', err);
        } else {
          await schemaFetcher.setApiToken(data.token);
          await render();
        }
      },
    );
  };
}
