"use strict";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
 console.log('Extension "vscode-graphql" is now active!');

 let disposable = vscode.commands.registerCommand(
  "extension.isDebugging",
  () => {
   const config = vscode.workspace.getConfiguration("vscode-graphql");
   vscode.window.showInformationMessage(`debug: ${config.debug}`);
  }
 );

 context.subscriptions.push(disposable);
}

export function deactivate() {
 console.log('Extension "vscode-graphql" is now de-active!');
}
