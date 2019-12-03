/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

const { exec } = require('./util');

const commands = [
  'babel',
  'src',
  '--ignore',
  '**/__tests__/**',
  '--ignore',
  '**/*.spec.*',
  '--out-dir',
  'dist',
  '--root-mode',
  'upward',
];
const extraArgs = process.argv[2];
if (extraArgs) {
  commands.push(extraArgs.split(' '));
}
exec(...commands);
