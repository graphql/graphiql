import {
  workspace,
  ExtensionContext,
  window,
  commands,
  OutputChannel,
  TextDocument,
  Uri,
} from 'vscode';

import {
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  RevealOutputChannelOn,
  LanguageClient,
} from 'vscode-languageclient/node';

import * as path from 'path';
import { createStatusBar, initStatusBar } from './apis/statusBar';

const clients: Map<string, LanguageClient> = new Map();

export async function activate(context: ExtensionContext) {
  const outputChannel: OutputChannel = window.createOutputChannel(
    'GraphQL Language Server',
  );

  const statusBarItem = createStatusBar();
  context.subscriptions.push(statusBarItem);

  async function onDidOpenTextDocument(document: TextDocument): Promise<void> {
    const config = getConfig(document.uri);
    const { debug } = config;
    if (debug) {
      console.log('Extension "vscode-graphql" is now active!');
    }

    const serverPath = path.join('out', 'server', 'index.js');
    const serverModule = context.asAbsolutePath(serverPath);

    const folder = workspace.getWorkspaceFolder(document.uri);
    if (folder === undefined || clients.has(folder.uri.toString())) {
      return;
    }

    const debugOptions = {
      execArgv: ['--nolazy', `--inspect=localhost:${6009 + clients.size}`],
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
        {
          scheme: 'file',
          language: 'graphql',
          pattern: `${folder.uri.fsPath}/**/*`,
        },
        {
          scheme: 'file',
          language: 'javascript',
          pattern: `${folder.uri.fsPath}/**/*`,
        },
        {
          scheme: 'file',
          language: 'javascriptreact',
          pattern: `${folder.uri.fsPath}/**/*`,
        },
        {
          scheme: 'file',
          language: 'typescript',
          pattern: `${folder.uri.fsPath}/**/*`,
        },
        {
          scheme: 'file',
          language: 'typescriptreact',
          pattern: `${folder.uri.fsPath}/**/*`,
        },
      ],
      synchronize: {
        // TODO: This should include any referenced graphql files inside the graphql-config
        fileEvents: [
          workspace.createFileSystemWatcher(
            `${folder.uri.fsPath}/{graphql.config.*,.graphqlrc,.graphqlrc.*,package.json}`,
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
            `${folder.uri.fsPath}/**/{*.graphql,*.graphqls,*.gql,*.js,*.mjs,*.cjs,*.esm,*.es,*.es6,*.jsx,*.ts,*.tsx}`,
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
      workspaceFolder: folder,
    };

    const client = new LanguageClient(
      'vscode-graphql',
      serverOptions,
      clientOptions,
      debug,
    );

    await client.start();
    clients.set(folder.uri.toString(), client);
    initStatusBar(statusBarItem, client, window.activeTextEditor);
  }

  workspace.onDidOpenTextDocument(onDidOpenTextDocument);
  workspace.textDocuments.forEach(onDidOpenTextDocument);
  workspace.onDidChangeWorkspaceFolders(event => {
    for (const folder of event.removed) {
      const client = clients.get(folder.uri.toString());
      if (client) {
        clients.delete(folder.uri.toString());
        client.stop();
      }
    }
  });

  const commandShowOutputChannel = commands.registerCommand(
    'vscode-graphql.showOutputChannel',
    () => outputChannel.show(),
  );

  context.subscriptions.push(commandShowOutputChannel);

  commands.registerCommand('vscode-graphql.restart', async () => {
    outputChannel.appendLine(`Stopping GraphQL LSP`);
    await stopClients();

    outputChannel.appendLine(`Restarting GraphQL LSP`);
    await startClients();
    outputChannel.appendLine(`GraphQL LSP restarted`);
  });
}

export function deactivate() {
  console.log('Extension "vscode-graphql" will be de-activated!!');
  return stopClients();
}

function getConfig(resource: Uri) {
  return workspace.getConfiguration('vscode-graphql', resource);
}

async function stopClients() {
  const promises: Promise<void>[] = [];
  for (const client of clients.values()) {
    promises.push(client.stop());
  }
  return Promise.all(promises).then(() => undefined);
}

async function startClients() {
  const promises: Promise<void>[] = [];
  for (const client of clients.values()) {
    promises.push(client.start());
  }
  return Promise.all(promises).then(() => undefined);
}
