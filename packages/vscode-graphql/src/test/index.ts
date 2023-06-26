/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path from 'path';
import Mocha from 'mocha';
// import { readFileSync, readdirSync } from 'fs';

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });

  const testsRoot = __dirname;

  try {
    console.log(path.resolve(testsRoot, 'diagnostics.test.js'));
    mocha.addFile(path.resolve(testsRoot, 'diagnostics.test.js'));
  } catch (err) {
    console.log(err);
  }

  try {
    console.log('made it here');
    // Run the mocha test
    mocha.run(failures => {
      if (failures > 0) {
        throw new Error(`${failures} tests failed.`);
      } else {
        console.log('tests passed');
        return;
      }
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
