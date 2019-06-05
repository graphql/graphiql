/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

const {readdirSync} = require('fs');
const {join} = require('path');
const {cp} = require('./util');

// Non-recursively copy src/*.js to dist/*.js.flow:
readdirSync('src').forEach(entry => {
  if (entry.endsWith('.js')) {
    const source = join('src', entry);
    const destination = join('dist', `${entry}.flow`);
    cp(source, destination);
  }
});
