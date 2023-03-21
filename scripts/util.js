/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const { execFileSync } = require('node:child_process');
const { createReadStream, createWriteStream } = require('node:fs');

function cp(source, destination) {
  createReadStream(source).pipe(createWriteStream(destination));
}

function exec(executable, ...args) {
  try {
    print(execFileSync(executable, args).toString());
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function print(string) {
  process.stdout.write(string);
}

module.exports = { cp, exec, print };
