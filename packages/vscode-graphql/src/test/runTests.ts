/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './index');


    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      version: '1.40.1',
      launchArgs: [
        'fixtures',
        'fixtures/diagnostics.txt',
          '--disable-workspace-trust',
        // '--disable-workspace-trust'
        // '--install-extension',
        // 'GraphQL.vscode-graphql-syntax',
        // '--install-extension',
        // 'GraphQL.vscode-graphql-execution',
        '--wait',
       
      ],
      // reuseMachineInstall: true,
    //   reuseMachineInstall: true
    });

    console.log('tests run!');
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
