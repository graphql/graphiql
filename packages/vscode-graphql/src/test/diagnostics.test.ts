/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';


suite('Should get diagnostics', async () => {
	console.log('testing...!')

	const docUri = getDocUri('src/queries/query.ts');
	console.log('retrived doc uri')

  console.log('testing file!!')
  await testDiagnostics(docUri, [
    {
      message: 'ANY is all uppercase.',
      range: toRange(0, 0, 0, 3),
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'ex',
    },
    {
      message: 'ANY is all uppercase.',
      range: toRange(0, 14, 0, 17),
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'ex',
    },
    {
      message: 'OS is all uppercase.',
      range: toRange(0, 18, 0, 20),
      severity: vscode.DiagnosticSeverity.Warning,
      source: 'ex',
    },
  ]);

  test('diagnoses uppercase texts', async () => {
  
  })
});

async function testDiagnostics(
  docUri: vscode.Uri,
  expectedDiagnostics: vscode.Diagnostic[],
  ) {
  console.log('testDiagnostics')
  await activate(docUri);
  console.log('post activate method')

  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);
  console.log(actualDiagnostics)
  
  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);
  
  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
  });
  }

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}

