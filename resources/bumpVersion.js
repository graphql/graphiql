#!/usr/bin/env node
/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const {execFile} = require('child_process');
const {readdirSync, writeFileSync} = require('fs');
const {join} = require('path');

const versions = require('../versions.json');
const mainPackage = {
  info: require('../package.json'),
  location: join(process.cwd(), '..', 'package.json'),
};
const otherPackages = readdirSync('packages').map(pkg => {
  const location = join(process.cwd(), 'packages', pkg, 'package.json');
  return {
    info: require(location),
    location,
  };
});
const allPackages = {};
[mainPackage, ...otherPackages].forEach(pkg => {
  allPackages[pkg.info.name] = pkg;
});
const packageNames = Object.keys(allPackages);

function exec(...commandAndArgs) {
  const [command, ...args] = commandAndArgs;
  return new Promise((resolve, reject) => {
    execFile(command, args, (err, stdout) => {
      if (err) {
        reject(error);
      } else {
        resolve(stdout.toString().trim());
      }
    });
  });
}

function print(message) {
  process.stdout.write(message + '\n');
}

function parseArguments() {
  const args = [...process.argv];
  const startIndex = args.findIndex(arg => arg === __filename);
  if (startIndex === -1) {
    throw new Error('Failed to parse executable name from arguments');
  }
  let bumpType = null;
  let bumpTargetName = null;
  for (let i = startIndex + 1; i < args.length; i++) {
    let typeMatch = args[i].match(/^--(major|minor|patch)$/i);
    if (typeMatch) {
      bumpType = typeMatch[1].toLowerCase();
    } else if (packageNames.indexOf(args[i]) === -1) {
      throw new Error(`Unrecognized package name: ${args[i]}`);
    } else if (bumpTargetName) {
      throw new Error(`May only specify one package to bump`);
    } else {
      bumpTargetName = args[i];
    }
  }
  if (!bumpType) {
    print('info: no bump type specified, defaulting to --patch');
    bumpType = 'patch';
  }
  if (!bumpTargetName) {
    print('usage: bumpVersion.js [--major|--minor|--patch] package-name');
    process.exit(0);
  }
  return [bumpType, bumpTargetName];
}

function genPublishedVersions(packageNames) {
  const results = packageNames.map(name =>
    exec('npm', 'view', name, 'version'));
  return Promise.all(results);
}

function explodeVersion(versionString) {
  return versionString.split('.').map(number => parseInt(number, 10));
}

function bumpVersionString(versionString, bumpType) {
  const [major, minor, patch] = explodeVersion(versionString);
  if (bumpType === 'major') {
    return [major + 1, 0, 0].join('.');
  } else if (bumpType === 'minor') {
    return [major, minor + 1, 0].join('.');
  } else {
    return [major, minor, patch + 1].join('.');
  }
}

function compareVersions(a, b) {
  const aComponents = explodeVersion(a);
  const bComponents = explodeVersion(b);
  while (aComponents.length && bComponents.length) {
    const aComponent = aComponents.shift();
    const bComponent = bComponents.shift();
    if (aComponent < bComponent) {
      return 1;
    } else if (aComponent > bComponent) {
      return -1;
    }
  }
  if (aComponents.length) {
    return -1;
  }
  if (bComponents.length) {
    return 1;
  }
  return 0;
}

/**
 * Get the direct dependents of `dependency`.
 */
function getDependents(dependencyName) {
  return Object.values(allPackages).filter(({info: pkg}) => {
    return pkg.dependencies &&
      Object.keys(pkg.dependencies).indexOf(dependencyName) !== -1;
  });
}

function bumpVersion(bumpTarget, bumpType, bumped = new Set()) {
  const {name} = bumpTarget.info;
  const {published, version} = versions[name];
  if (compareVersions(published, version) > 0) {
    const message = `Local version of ${name} (${version}) is ` +
      `already ahead of published version (${published}); no need to bump.`;
    print(message);
  } else {
    const bumpedVersion = bumpVersionString(published, bumpType);
    const message = `Bumping from published version of ${name} ` +
      `(${published}) to new ${bumpType} version (${bumpedVersion}).`;
    print(message);
    versions[name].version = (versions[name].local = bumpedVersion);

    const pkg = allPackages[name];
    pkg.info.version = bumpedVersion;
    writeFileSync(pkg.location, JSON.stringify(pkg.info, null, 2) + '\n');
    bumped.add(pkg);

    getDependents(name).forEach(dependent => {
      if (!bumped.has(dependent)) {
        bumpVersion(dependent, bumpType, bumped);
      }
    });
  }
}

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

(async function run() {
  const [bumpType, bumpTargetName] = parseArguments();
  const publishedVersions = await genPublishedVersions(packageNames);
  packageNames.forEach((name, i) => {
    versions[name].published = publishedVersions[i];
    versions[name].local = allPackages[name].info.version;
  });
  bumpVersion(allPackages[bumpTargetName], bumpType);

  // TODO: warn if versions file and package.json gets out of sync
  // TODO: write out clean copy of versions file:
  console.log(versions);
})();
