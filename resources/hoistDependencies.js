#!/usr/bin/env node
/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * Hoists dependencies to the top-level (primarily intended for use in
 * Travis CI).
 */

const {readdirSync, writeFileSync} = require('fs');
const {join} = require('path');

const mainPackage = require('../package.json');
const otherPackages = readdirSync('packages').map(pkg =>
  require(join(process.cwd(), 'packages', pkg, 'package.json')));

const dependencies = mainPackage.dependencies;
otherPackages.forEach(pkg => {
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(dependency => {
      if (dependency === mainPackage.name) {
        return;
      }
      const version = pkg.dependencies[dependency];
      if (dependencies[dependency] && dependencies[dependency] !== version) {
        const message = `Multiple versions ` +
          `(${version}, ${dependencies[dependency]}) present for package: ` +
          dependency;
        throw new Error(message);
      }
      dependencies[dependency] = version;
    });
  }
});

const outfile = join(process.cwd(), 'package.json');
const contents = JSON.stringify(mainPackage, null, 2) + '\n';
writeFileSync(outfile, contents);
