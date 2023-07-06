import {
  workspace,
  ExtensionContext,
  window,
  commands,
  OutputChannel,
} from 'vscode';

import {
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  RevealOutputChannelOn,
  LanguageClient,
} from 'vscode-languageclient/node';

import * as path from 'node:path';
import { createStatusBar, initStatusBar } from './apis/statusBar';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
  const outputChannel: OutputChannel = window.createOutputChannel(
    'GraphQL Language Server',
  );

  const config = getConfig();
  const { debug } = config;
  if (debug) {
    // eslint-disable-next-line no-console
    console.log('Extension "vscode-graphql" is now active!');
  }

  const serverPath = path.join('out', 'server', 'index.js');
  const serverModule = context.asAbsolutePath(serverPath);

  const debugOptions = {
    execArgv: ['--nolazy', '--inspect=localhost:6009'],
  };

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { ...(debug ? debugOptions : {}) },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'graphql' },
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'typescriptreact' },
      { scheme: 'file', language: 'vue' },
      { scheme: 'file', language: 'svelte' },
    ],
    synchronize: {
      // TODO: This should include any referenced graphql files inside the graphql-config
      fileEvents: [
        workspace.createFileSystemWatcher(
          '/{graphql.config.*,.graphqlrc,.graphqlrc.*,package.json}',
          false,
          // Ignore change events for graphql config, we only care about create, delete and save events
          // otherwise, the underlying language service is re-started on every key change.
          // also, it makes sense that it should only re-load on file save, but we need to document that.
          // TODO: perhaps we can intercept change events, and remind the user
          // to save for the changes to take effect
          true,
        ),
        // TODO: load ignore
        // These ignore node_modules and .git by default
        workspace.createFileSystemWatcher(
          '**/{*.graphql,*.graphqls,*.gql,*.js,*.mjs,*.cjs,*.esm,*.es,*.es6,*.jsx,*.ts,*.tsx,*.vue,*.svelte,*.cts,*.mts,*.json}',
        ),
      ],
    },
    outputChannel,
    outputChannelName: 'GraphQL Language Server',
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationFailedHandler(err) {
      outputChannel.appendLine('Initialization failed');
      outputChannel.appendLine(err.message);
      if (err.stack) {
        outputChannel.appendLine(err.stack);
      }
      if (debug) {
        outputChannel.show();
      }
      return false;
    },
  };

  client = new LanguageClient(
    'vscode-graphql',
    serverOptions,
    clientOptions,
    debug,
  );

  const statusBarItem = createStatusBar();
  context.subscriptions.push(statusBarItem);

  await client.start();
  initStatusBar(statusBarItem, client, window.activeTextEditor);

  const commandShowOutputChannel = commands.registerCommand(
    'vscode-graphql.showOutputChannel',
    () => outputChannel.show(),
  );

  context.subscriptions.push(commandShowOutputChannel);

  commands.registerCommand('vscode-graphql.restart', async () => {
    outputChannel.appendLine('Stopping GraphQL LSP');
    await client.stop();

    outputChannel.appendLine('Restarting GraphQL LSP');
    await client.start();
    outputChannel.appendLine('GraphQL LSP restarted');
  });
}

export function deactivate() {
  if (!client) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log('Extension "vscode-graphql" will be de-activated!');
  return client.stop();
}

function getConfig() {
  return workspace.getConfiguration(
    'vscode-graphql',
    window.activeTextEditor ? window.activeTextEditor.document.uri : null,
  );
}
