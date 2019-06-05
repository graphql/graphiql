#!/usr/bin/env node
/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const {spawnSync} = require('child_process');
const {join} = require('path');

const INVERSE = '\x1b[7m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

const options = [
  '--no-bracket-spacing',
  '--single-quote',
  '--trailing-comma=all',
];
const glob = '{packages/*/{resources,src},resources,src}/**/*.js';
const root = join(__dirname, '..');
const executable = join(root, 'node_modules', '.bin', 'prettier');

const check = process.argv.indexOf('--check') !== -1;
const mode = check ? '--list-different' : '--write';
process.chdir(root);

const {stdout, stderr, status, error} = spawnSync(executable, [
  ...options,
  mode,
  glob,
]);
const out = stdout.toString().trim();
const err = stderr.toString().trim();

function print(message) {
  if (message) {
    process.stdout.write(message + '\n');
  }
}

if (status) {
  print(out);
  print(err);
  if (check) {
    print(`\n${YELLOW}The files listed above are not correctly formatted.`);
    print(`Try: ${INVERSE} yarn run pretty ${RESET}`);
  }
}
if (error) {
  print('error', error);
}
process.exit(status != null ? status : 1);
