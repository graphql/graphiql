#!/usr/bin/env node
/*
 * Copyright (c) 2021 GraphQL Contributors
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

if (process?.env) {
  process.env.GRAPHQL_NO_NAME_WARNING = true;
}

require('@babel/polyfill');
require('../esm/cli');
