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
import { ConfigHelper } from './helpers/config';

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

  const graphqlConfigHelper = new ConfigHelper(outputChannel);

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
    console.log('re-registering codelens');
    const provider = languages.registerCodeLensProvider(
      [
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
        'graphql',
      ],
      new GraphQLCodeLensProvider(outputChannel, graphqlConfigHelper),
    );
    context.subscriptions.push(provider);
    return provider;
  };

  // if (settings.showExecCodelens !== false) {
  let codeLensProvider = registerCodeLens();

  // }

  let commandContentProvider: GraphQLContentProvider;
  let registration: null | ReturnType<
    typeof workspace.registerTextDocumentContentProvider
  > = null;
  const registerContentProvider = () => {
    const provider = commands.registerCommand(
      'vscode-graphql-execution.contentProvider',
      async (literal: ExtractedTemplateLiteral) => {
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
          graphqlConfigHelper,
        );
        await commandContentProvider.loadProvider();
        registration = workspace.registerTextDocumentContentProvider(
          'graphql',
          commandContentProvider,
        );
        context.subscriptions.push(registration);
        panel.webview.html = commandContentProvider.getCurrentHtml();
      },
    );
    context.subscriptions.push(provider);
    return provider;
  };

  // workspace.onDidChangeConfiguration(async () => {
  //   // const newSettings = workspace.getConfiguration("vscode-graphql-execution")
  //   // if (newSettings.showExecCodeLens !== false) {
  //   provider.dispose();
  //   // }
  // });

  workspace.onDidSaveTextDocument(async e => {
    if (
      e.fileName.includes('graphql.config') ||
      e.fileName.includes('graphqlrc')
    ) {
      codeLensProvider.dispose();
      codeLensProvider = registerCodeLens();
    }
  });
}

export function deactivate() {
  // eslint-disable-next-line no-console
  console.log('Extension "vscode-graphql-execution" is now de-active!');
} // documents: ["./src/*.ts"],
