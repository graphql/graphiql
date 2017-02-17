/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

// NOTE: Because prepublish is also invoked on "npm install", we can't
// rely on babel-node being available. This means two things:
//
// (1) We must stick to a vanilla subset of ES6 features; and:
// (2) We start off with a check to bail out when not invoked as part of
//     "npm publish".

var config = require('../package.json');
if (config.scripts.prepublish.indexOf('node ') !== 0) {
  // Guard against somebody helpfully trying to make the package.json scripts
  // consistent by using "babel-node" instead of "node" (which would break
  // the initial "npm install").
  console.error(
    'prepublish.js should be invoked with `node`, not `babel-node`'
  );
  process.exit(1);
}

// Bail unless we're running during `npm publish`.
var argv = JSON.parse(process.env.npm_config_argv).original;
var isPublishing = argv[0].indexOf('pu') === 0;
if (!isPublishing) {
  process.exit(0);
}

// Otherwise, perform a build.
var execFileSync = require('child_process').execFileSync;
process.stdout.write(
  execFileSync('npm', ['run', 'build'])
);
