#!/usr/bin/env node
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */


if (process && process.env) {
  process.env.GRAPHQL_NO_NAME_WARNING = true;
}

require('babel-polyfill');
require('../dist/cli');
