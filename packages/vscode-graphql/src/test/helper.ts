/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as path from 'path';
import { writeFileSync } from 'fs';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(docUri: vscode.Uri) {
  try {
    console.log('activating');
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension('GraphQL.vscode-graphql')!;
    console.log('ext retrieved', ext.id);
    // console.log('extensionPath', ext.extensionPath);
    // console.log('extensionKind', ext.extensionKind);
    // console.log('extensionUri', ext.extensionUri);
    // console.log('packageJSON', ext.packageJSON);
    writeFileSync(
      __dirname + '/../outext-activate.js',
      'module.exports = ' + JSON.stringify(ext, null, 2) + `\n\n${ext.activate}`,
    );

    await ext.activate();
    console.log('ext activated', docUri);
    // editor = await vscode.window.showTextDocument(docUri);
    await sleep(5000)
    console.log('doc shown')
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string) => {
  console.log('path', path.resolve(__dirname, '../../fixtures', p))
  return path.resolve(__dirname, '../../fixtures', p);
};
export const getDocUri = (p: string) => {
  console.log('docuri', vscode.Uri.file(getDocPath(p)))
  return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length),
  );
  return editor.edit(eb => eb.replace(all, content));
}
