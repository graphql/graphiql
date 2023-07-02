/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'node:assert';
import * as helpers from './helper';

suite('Should get diagnostics', function() {
  console.log('testing...!');
  test('example', () => {
    assert.equal(1, 1);
  });

  test('diagnoses uppercase texts', async () => {
    assert.equal(1, 1);
  });

  // eslint-disable-next-line prefer-arrow-callback
  test('diagnostics', async function(done)  {
    this.timeout(20000)
    const docUri = helpers.getDocUri('src/queries/query.ts');
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
    ], done);
  });
});

async function testDiagnostics(
  docUri: vscode.Uri,
  expectedDiagnostics: vscode.Diagnostic[],
  done: Mocha.Done
) {
  console.log('testDiagnostics');
  console.log('post activate method');

  await helpers.sleep(1000)
  debugger;
  const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

  console.log(actualDiagnostics);

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i];
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
    done()
  });
 
}

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new vscode.Position(sLine, sChar);
  const end = new vscode.Position(eLine, eChar);
  return new vscode.Range(start, end);
}
