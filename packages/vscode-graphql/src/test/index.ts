/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path from 'path';
import { default as Mocha } from 'mocha';
// import { readFileSync, readdirSync } from 'fs';

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
   // timeout: 1000000
  });

  mocha.timeout(100000)

  const testsRoot = __dirname;

  try {
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
