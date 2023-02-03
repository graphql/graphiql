/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';
const path = require('node:path');
const { exec } = require('./util');

exec(
  'jest',
  '--config',
  path.join(__dirname, '../', 'jest.config.js'),
  '--rootDir',
);
