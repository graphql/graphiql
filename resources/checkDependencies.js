#!/usr/bin/env node
/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const {readdirSync} = require('fs');
const {join} = require('path');

const mainPackage = require('../package.json');
const otherPackages = readdirSync('packages').map(pkg =>
  require(join(process.cwd(), 'packages', pkg, 'package.json')));

function print(msg) {
  process.stdout.write(msg + '\n');
}

const versions = {};
[mainPackage, ...otherPackages].forEach(pkg => {
  const dependencies = pkg.dependencies;
  if (dependencies) {
    Object.keys(dependencies).forEach(name => {
      const version = dependencies[name];
      if (!versions[name]) {
        versions[name] = {};
      }
      if (!versions[name][version]) {
        versions[name][version] = [];
      }
      versions[name][version].push(pkg.name);
    });
  }
});

let problemCount = 0;
Object.keys(versions).forEach(pkg => {
  versionRanges = Object.keys(versions[pkg]);
  if (versionRanges.length > 1) {
    problemCount++;
    print(`Package versions for ${pkg} do not match:`);
    versionRanges.forEach(range => {
      versions[pkg][range].forEach(dependent => {
        print(`    ${dependent}`);
      });
      print(`  depend on ${pkg} version ${range}`);
    });
  }
});

if (problemCount) {
  print(`\nPackages with version conflicts: ${problemCount}`);
  process.exit(1);
}
