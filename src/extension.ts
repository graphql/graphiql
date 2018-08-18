"use strict";
import * as path from "path";
import {
  workspace,
  ExtensionContext,
  window,
  commands,
  OutputChannel,
  languages,
  Uri,
  ViewColumn
} from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient";

import statusBarItem, { initStatusBar } from "./status";

import { GraphQLContentProvider } from "./client/graphql-content-provider";
import { GraphQLCodeLensProvider } from "./client/graphql-codelens-provider";
import { ExtractedTemplateLiteral } from "./client/source-helper";

function getConfig() {
  return workspace.getConfiguration(
    "vscode-graphql",
    window.activeTextEditor ? window.activeTextEditor.document.uri : null
  );
}

export async function activate(context: ExtensionContext) {
  let outputChannel: OutputChannel = window.createOutputChannel(
    "GraphQL Language Server"
  );
  const config = getConfig();
  const { debug } = config;
  if (debug) {
    console.log('Extension "vscode-graphql" is now active!');
  }

  const serverModule = context.asAbsolutePath(
    path.join("out/server", "server.js")
  );

  const debugOptions = {
    execArgv: ["--nolazy", "--debug=6009", "--inspect=localhost:6009"]
  };

  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debug ? debugOptions : {}
    }
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "graphql" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.{graphql,gql}")
    },
    outputChannel: outputChannel,
    outputChannelName: "GraphQL Language Server"
  };

  const client = new LanguageClient(
    "vscode-graphql",
    "GraphQL Language Server",
    serverOptions,
    clientOptions,
    debug
  );

  const disposableClient = client.start();
  context.subscriptions.push(disposableClient);

  const commandIsDebugging = commands.registerCommand(
    "extension.isDebugging",
    () => {
      outputChannel.appendLine(`is in debug mode: ${!!debug}`);
    }
  );
  context.subscriptions.push(commandIsDebugging);

  // Manage Status Bar
  context.subscriptions.push(statusBarItem);
  client.onReady().then(() => {
    initStatusBar(statusBarItem, client, window.activeTextEditor);
  });

  context.subscriptions.push(
    languages.registerCodeLensProvider(
      ["javascript", "typescript", "javascriptreact", "typescriptreact"],
      new GraphQLCodeLensProvider(outputChannel)
    )
  );

  const commandContentProvider = commands.registerCommand(
    "extension.contentProvider",
    (literal: ExtractedTemplateLiteral) => {
      const uri = Uri.parse("graphql://authority/graphql");
      const contentProvider = new GraphQLContentProvider(
        uri,
        outputChannel,
        literal
      );
      const registration = workspace.registerTextDocumentContentProvider(
        "graphql",
        contentProvider
      );
      context.subscriptions.push(registration);

      return commands
        .executeCommand(
          "vscode.previewHtml",
          uri,
          ViewColumn.Two,
          "GraphQL Content Provider"
        )
        .then(
          _ => {},
          _ => {
            window.showErrorMessage("Error opening content.");
          }
        );
    }
  );
  context.subscriptions.push(commandContentProvider);
}

export function deactivate() {
  console.log('Extension "vscode-graphql" is now de-active!');
}
