/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

'use strict';

const {execFileSync} = require('child_process');
const {createReadStream, createWriteStream} = require('fs');

function cp(source, destination) {
  createReadStream(source).pipe(createWriteStream(destination));
}

function exec(executable, ...args) {
  print(execFileSync(executable, args).toString());
}

function print(string) {
  process.stdout.write(string);
}

module.exports = {cp, exec, print};
