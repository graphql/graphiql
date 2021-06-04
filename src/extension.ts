"use strict"
import * as path from "path"
import {
  workspace,
  ExtensionContext,
  window,
  commands,
  OutputChannel,
  languages,
  Uri,
  ViewColumn,
} from "vscode"
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  RevealOutputChannelOn,
} from "vscode-languageclient"

import statusBarItem, { initStatusBar } from "./status"

import { GraphQLContentProvider } from "./client/graphql-content-provider"
import { GraphQLCodeLensProvider } from "./client/graphql-codelens-provider"
import { ExtractedTemplateLiteral } from "./client/source-helper"
import { CustomInitializationFailedHandler } from "./CustomInitializationFailedHandler"

function getConfig() {
  return workspace.getConfiguration(
    "vscode-graphql",
    window.activeTextEditor ? window.activeTextEditor.document.uri : null,
  )
}

export function activate(context: ExtensionContext) {
  let outputChannel: OutputChannel = window.createOutputChannel(
    "GraphQL Language Server",
  )
  const config = getConfig()
  const { debug } = config

  if (debug) {
    console.log('Extension "vscode-graphql" is now active!')
  }

  const serverModule = context.asAbsolutePath(
    path.join("out/server", "server.js"),
  )

  const debugOptions = {
    execArgv: ["--nolazy", "--inspect=localhost:6009"],
  }

  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { ...(debug ? debugOptions : {}) },
    },
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "graphql" },
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "javascriptreact" },
      { scheme: "file", language: "typescript" },
      { scheme: "file", language: "typescriptreact" },
      // this applies grammar and thus highlighting i think?
      { scheme: "file", language: "vue" },
    ],
    synchronize: {
      // TODO: should this focus on `graphql-config` documents, schema and/or includes?
      fileEvents: [
        workspace.createFileSystemWatcher(
          "/{graphql.config.*,.graphqlrc,.graphqlrc.*,package.json}",
          false,
          // ignore change events for graphql config, we only care about create, delete and save events
          true,
        ),
        // these ignore node_modules and .git by default
        // this is more important for language features.
        // we don't have language features for .vue yet but we can still try to load the files
        workspace.createFileSystemWatcher(
          "**/{*.graphql,*.graphqls,*.gql,*.js,*.mjs,*.cjs,*.esm,*.es,*.es6,*.jsx,*.ts,*.tsx,*.vue}",
        ),
      ],
    },
    outputChannel: outputChannel,
    outputChannelName: "GraphQL Language Server",
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationFailedHandler:
      CustomInitializationFailedHandler(outputChannel),
  }

  const client = new LanguageClient(
    "vscode-graphql",
    "GraphQL Language Server",
    serverOptions,
    clientOptions,
    debug,
  )

  const disposableClient = client.start()
  context.subscriptions.push(disposableClient)

  const commandIsDebugging = commands.registerCommand(
    "vscode-graphql.isDebugging",
    () => {
      outputChannel.appendLine(`is in debug mode: ${!!debug}`)
    },
  )
  context.subscriptions.push(commandIsDebugging)

  // Manage Status Bar
  context.subscriptions.push(statusBarItem)
  client.onReady().then(() => {
    initStatusBar(statusBarItem, client, window.activeTextEditor)
  })

  const settings = workspace.getConfiguration("vscode-graphql")

  const registerCodeLens = () => {
    context.subscriptions.push(
      languages.registerCodeLensProvider(
        [
          "javascript",
          "typescript",
          "javascriptreact",
          "typescriptreact",
          "vue",
          "graphql",
        ],
        new GraphQLCodeLensProvider(outputChannel),
      ),
    )
  }

  if (settings.showExecCodelens) {
    registerCodeLens()
  }

  workspace.onDidChangeConfiguration(() => {
    const newSettings = workspace.getConfiguration("vscode-graphql")
    if (newSettings.showExecCodeLens) {
      registerCodeLens()
    }
  })

  const commandContentProvider = commands.registerCommand(
    "vscode-graphql.contentProvider",
    async (literal: ExtractedTemplateLiteral) => {
      const uri = Uri.parse("graphql://authority/graphql")

      const panel = window.createWebviewPanel(
        "vscode-graphql.results-preview",
        "GraphQL Execution Result",
        ViewColumn.Two,
        {},
      )

      const contentProvider = new GraphQLContentProvider(
        uri,
        outputChannel,
        literal,
        panel,
      )
      const registration = workspace.registerTextDocumentContentProvider(
        "graphql",
        contentProvider,
      )
      context.subscriptions.push(registration)

      const html = await contentProvider.getCurrentHtml()
      panel.webview.html = html
    },
  )
  context.subscriptions.push(commandContentProvider)

  commands.registerCommand("vscode-graphql.restart", async () => {
    await client.stop()
    await client.start()
  })
}

export function deactivate() {
  console.log('Extension "vscode-graphql" is now de-active!')
}
