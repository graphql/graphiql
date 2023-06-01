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
    console.log('Extension "vscode-graphql" is now active!');
  }

  const commandShowOutputChannel = commands.registerCommand(
    'vscode-graphql-execution.showOutputChannel',
    () => {
      outputChannel.show();
    },
  );
  context.subscriptions.push(commandShowOutputChannel);

  // const settings = workspace.getConfiguration("vscode-graphql-execution")

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

  workspace.onDidChangeConfiguration(() => {
    // const newSettings = workspace.getConfiguration("vscode-graphql-execution")
    // if (newSettings.showExecCodeLens !== false) {
    registerCodeLens();
    // }
  });

  const commandContentProvider = commands.registerCommand(
    'vscode-graphql-execution.contentProvider',
    (literal: ExtractedTemplateLiteral) => {
      const uri = Uri.parse('graphql://authority/graphql');

      const panel = window.createWebviewPanel(
        'vscode-graphql-execution.results-preview',
        'GraphQL Execution Result',
        ViewColumn.Two,
        {},
      );

      const contentProvider = new GraphQLContentProvider(
        uri,
        outputChannel,
        literal,
        panel,
      );
      const registration = workspace.registerTextDocumentContentProvider(
        'graphql',
        contentProvider,
      );
      context.subscriptions.push(registration);
      panel.webview.html = contentProvider.getCurrentHtml();
    },
  );
  context.subscriptions.push(commandContentProvider);
}

export function deactivate() {
  // eslint-disable-next-line no-console
  console.log('Extension "vscode-graphql-execution" is now de-active!');
}
