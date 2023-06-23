'use strict';
import {
  workspace,
  ExtensionContext,
  window,
  commands,
  OutputChannel,
  languages,
  Uri,
  ViewColumn,
  // Command,
  // Disposable,
} from 'vscode';

import { GraphQLContentProvider } from './providers/exec-content';
import { GraphQLCodeLensProvider } from './providers/exec-codelens';
import { ExtractedTemplateLiteral } from './helpers/source';

function getConfig() {
  return workspace.getConfiguration(
    'vscode-graphql-execution',
    window.activeTextEditor?.document.uri,
  );
}

export function activate(context: ExtensionContext) {
  const outputChannel: OutputChannel = window.createOutputChannel(
    'GraphQL Operation Execution',
  );
  const config = getConfig();

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('Extension "vscode-graphql-execution" is now active!');
  }

  const commandShowOutputChannel = commands.registerCommand(
    'vscode-graphql-execution.showOutputChannel',
    () => {
      outputChannel.show();
    },
  );
  context.subscriptions.push(commandShowOutputChannel);

  // const settings = workspace.getConfiguration("vscode-graphql-execution")
  // let provider: GraphQLCodeLensProvider;
  const registerCodeLens = () => {
    context.subscriptions.push(
      languages.registerCodeLensProvider(
        [
          'javascript',
          'typescript',
          'javascriptreact',
          'typescriptreact',
          'graphql',
        ],
        new GraphQLCodeLensProvider(outputChannel),
      ),
    );
  };

  // if (settings.showExecCodelens !== false) {
  registerCodeLens();
  // }

  let commandContentProvider: GraphQLContentProvider;

  const registerContentProvider = () => {
    return commands.registerCommand(
      'vscode-graphql-execution.contentProvider',
      (literal: ExtractedTemplateLiteral) => {
        const uri = Uri.parse('graphql://authority/graphql');

        const panel = window.createWebviewPanel(
          'vscode-graphql-execution.results-preview',
          'GraphQL Execution Result',
          ViewColumn.Two,
          {},
        );

        commandContentProvider = new GraphQLContentProvider(
          uri,
          outputChannel,
          literal,
          panel,
        );
        const registration = workspace.registerTextDocumentContentProvider(
          'graphql',
          commandContentProvider,
        );
        context.subscriptions.push(registration);
        panel.webview.html = commandContentProvider.getCurrentHtml();
      },
    );
  };

  const provider = registerContentProvider();
  context.subscriptions.push(provider);

  // workspace.onDidChangeConfiguration(async () => {
  //   // const newSettings = workspace.getConfiguration("vscode-graphql-execution")
  //   // if (newSettings.showExecCodeLens !== false) {
  //     commandContentProvider.dispose()
  //   // }
  // });
  workspace.onDidSaveTextDocument(async e => {
    if (
      e.fileName.includes('graphql.config') ||
      e.fileName.includes('graphqlrc')
    ) {
      await commandContentProvider.loadConfig();
    }
  });
}

export function deactivate() {
  // eslint-disable-next-line no-console
  console.log('Extension "vscode-graphql-execution" is now de-active!');
} // documents: ["./src/*.ts"],
