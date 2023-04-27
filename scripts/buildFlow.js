/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { cp } = require('./util');

// Non-recursively copy src/*.js to dist/*.js.flow:
for (const entry of readdirSync('src')) {
  if (entry.endsWith('.js')) {
    const source = join('src', entry);
    const destination = join(process.argv[2] || 'dist', `${entry}.flow`);
    cp(source, destination);
  }
}
