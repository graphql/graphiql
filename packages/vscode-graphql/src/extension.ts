import {
  workspace,
  ExtensionContext,
  window,
  commands,
  OutputChannel,
} from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  RevealOutputChannelOn,
} from 'vscode-languageclient';

import * as path from 'path';
import { createStatusBar, initStatusBar } from './apis/statusBar';

export function activate(context: ExtensionContext) {
  const outputChannel: OutputChannel = window.createOutputChannel(
    'GraphQL Language Server',
  );

  const config = getConfig();
  const { debug } = config;
  if (debug) {
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
        // These ignore node_modules and .git by default
        workspace.createFileSystemWatcher(
          '**/{*.graphql,*.graphqls,*.gql,*.js,*.mjs,*.cjs,*.esm,*.es,*.es6,*.jsx,*.ts,*.tsx}',
        ),
      ],
    },
    outputChannel,
    outputChannelName: 'GraphQL Language Server',
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationFailedHandler: err => {
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

  const client = new LanguageClient(
    'vscode-graphql',
    'GraphQL Language Server',
    serverOptions,
    clientOptions,
    debug,
  );

  let clientLSPDisposable = client.start();
  context.subscriptions.push(clientLSPDisposable);

  const commandShowOutputChannel = commands.registerCommand(
    'vscode-graphql.showOutputChannel',
    () => outputChannel.show(),
  );

  context.subscriptions.push(commandShowOutputChannel);

  const statusBarItem = createStatusBar();
  context.subscriptions.push(statusBarItem);
  client.onReady().then(() => {
    initStatusBar(statusBarItem, client, window.activeTextEditor);
  });

  commands.registerCommand('vscode-graphql.restart', async () => {
    outputChannel.appendLine(`Stopping GraphQL LSP`);
    await client.stop();

    clientLSPDisposable.dispose();

    outputChannel.appendLine(`Restarting GraphQL LSP`);
    clientLSPDisposable = client.start();
    context.subscriptions.push(clientLSPDisposable);

    outputChannel.appendLine(`GraphQL LSP restarted`);
  });
}

export function deactivate() {
  console.log('Extension "vscode-graphql" has been de-activated!!');
}

function getConfig() {
  return workspace.getConfiguration(
    'vscode-graphql',
    window.activeTextEditor ? window.activeTextEditor.document.uri : null,
  );
}
