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

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

const mainPackage = require('../package.json');
const otherPackages = readdirSync('packages').map(pkg =>
  require(join(process.cwd(), 'packages', pkg, 'package.json')));

function print(msg) {
  process.stdout.write(msg + '\n');
}

function printHighlight(msg) {
  print(`${BOLD}${YELLOW}${msg}${RESET}`);
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

let unhoistedCount = 0;
otherPackages.forEach(pkg => {
  if (pkg.devDependencies) {
    unhoistedCount++;
    const message = `Package ${pkg.name} has devDependencies which should be ` +
      'hoisted into the top-level package.json:';
    printHighlight(message);
    Object.keys(pkg.devDependencies).forEach(devDependency => {
      print(`  ${devDependency}`);
    });
    print('');
  }
});

let conflictCount = 0;
Object.keys(versions).forEach(pkg => {
  versionRanges = Object.keys(versions[pkg]);
  if (versionRanges.length > 1) {
    conflictCount++;
    print(`${BOLD}${YELLOW}Package versions for ${pkg} do not match:${RESET}`);
    versionRanges.forEach(range => {
      versions[pkg][range].forEach(dependent => {
        print(`    ${dependent}`);
      });
      print(`  depend on ${pkg} version ${range}`);
    });
    print('');
  }
});

if (unhoistedCount) {
  printHighlight(`Packages with unhoisted devDependencies: ${unhoistedCount}`);
}
if (conflictCount) {
  printHighlight(`Packages with version conflicts: ${conflictCount}`);
}

if (conflictCount || unhoistedCount) {
  process.exit(1);
}
