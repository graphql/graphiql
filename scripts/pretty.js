#!/usr/bin/env node
/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const { spawnSync } = require('child_process');
const { join } = require('path');
const os = require('os');

const INVERSE = '\x1b[7m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

// Simple glob because we use .eslintignore to limit it
const glob = '**/*.{js,ts,jsx,tsx,md,json5,json,html,css}';
const root = join(__dirname, '..');
const executable = join(
  root,
  'node_modules',
  '.bin',
  os.platform() !== 'win32' ? 'prettier' : 'prettier.cmd',
);
const ignorePath = ['--ignore-path', '.eslintignore'];
const check = process.argv.indexOf('--check') !== -1;
const mode = check ? '--list-different' : '--write';
process.chdir(root);

const { stdout, stderr, status, error } = spawnSync(executable, [
  ...ignorePath,
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
    print(
      `\n${YELLOW}Ooops! The files listed above are not correctly formatted.`,
    );
    print(
      [
        `Try: ${INVERSE} pnpm format ${RESET},`,
        `which executes eslint --fix and prettier in a specific order.`,
        `If you are using prettier for vscode you can also enable "format on save".`,
        `Learn more about contributing in DEVELOPMENT.md`,
      ].join('\n'),
    );
  }
}
if (error) {
  print(error);
}
process.exit(status != null ? status : 1);
