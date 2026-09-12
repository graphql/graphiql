import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const packages = path.join(root, 'packages');
const { packageManager } = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8'),
) as { packageManager: string };
const yarn = path.join(
  root,
  '.yarn/releases',
  `yarn-${packageManager.split('@')[1]}.cjs`,
);

for (const directory of readdirSync(packages, { withFileTypes: true })) {
  if (!directory.isDirectory()) {
    continue;
  }

  const manifest = JSON.parse(
    readFileSync(path.join(packages, directory.name, 'package.json'), 'utf8'),
  ) as { name: string; scripts?: Record<string, string> };

  if (
    !Object.values(manifest.scripts ?? {}).some(script =>
      /\btsgo\b/.test(script),
    )
  ) {
    continue;
  }

  test(`${manifest.name} resolves tsgo without Turbo`, () => {
    const result = spawnSync(
      process.execPath,
      [yarn, 'workspace', manifest.name, 'bin', 'tsgo'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    );

    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
}
