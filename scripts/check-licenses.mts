import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const correct = require('spdx-correct') as (license: string) => string | null;
const satisfies = require('spdx-satisfies') as (
  license: string,
  allowedLicenses: string,
) => boolean;

const greenLicenses = [
  '0BSD',
  'AFL-2.1',
  'AFL-3.0',
  'APSL-2.0',
  'Apache-1.1',
  'Apache-2.0',
  'Artistic-1.0',
  'Artistic-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSL-1.0',
  'CC-BY-1.0',
  'CC-BY-2.0',
  'CC-BY-2.5',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC0-1.0',
  'CDDL-1.0',
  'CDDL-1.1',
  'CPL-1.0',
  'EPL-1.0',
  'FTL',
  'IPL-1.0',
  'ISC',
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'LPL-1.02',
  'MIT',
  'MIT-0',
  'MPL-1.0',
  'MPL-1.1',
  'MPL-2.0',
  'MS-PL',
  'NCSA',
  'OpenSSL',
  'PHP-3.0',
  'Ruby',
  'Unlicense',
  'W3C',
  'Xnet',
  'ZPL-2.0',
  'Zend-2.0',
  'Zlib',
];

const packageAllowlist = new Set([
  // MIT, just lacking SPDX in manifest
  'valid-url',
  'argparse',
  'spawn-command',
  'spawndamnit',
  // BlueOak-1.0.0, permissive but not in the green license list
  'glob',
  'minimatch',
  'minipass',
  'path-scurry',
  'lru-cache',
  'rimraf',
  'package-json-from-dist',
  // CC BY-SA 4.0, used for cspell dictionary data
  '@cspell/dict-en-common-misspellings',
]);

type LicensedPackage = { name: string; versions: string[] };
type LicenseGroups = Record<string, LicensedPackage[]>;

const output = execFileSync('pnpm', ['licenses', 'list', '--json', '--prod'], {
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
const groups = JSON.parse(output) as LicenseGroups;

if (!groups || typeof groups !== 'object' || Object.keys(groups).length === 0) {
  throw new Error('pnpm returned no license data');
}

const allowedExpression = `(${greenLicenses.map(license => correct(license) || license).join(' OR ')})`;
let failures = 0;
let checkedPackages = 0;

for (const [license, packages] of Object.entries(groups)) {
  if (!Array.isArray(packages)) {
    throw new Error(`Invalid license data for ${license}`);
  }

  for (const pkg of packages) {
    if (
      !pkg ||
      typeof pkg.name !== 'string' ||
      !Array.isArray(pkg.versions) ||
      pkg.versions.length === 0 ||
      pkg.versions.some(version => typeof version !== 'string')
    ) {
      throw new Error(`Invalid package data for ${license}`);
    }
    checkedPackages += pkg.versions.length;

    if (packageAllowlist.has(pkg.name)) {
      continue;
    }

    let isGreen = false;
    try {
      isGreen = satisfies(correct(license) || license, allowedExpression);
    } catch {
      // Unknown or malformed license expressions need review.
    }

    if (!isGreen) {
      console.error(
        `${license || '(no license)'}: ${pkg.name}@${pkg.versions.join(', ')}`,
      );
      failures++;
    }
  }
}

if (checkedPackages === 0) {
  throw new Error('pnpm returned no packages to check');
}

if (failures > 0) {
  console.error(`${failures} packages have non-green licenses.`);
  process.exitCode = 1;
} else {
  console.log('All licenses are green.');
}
