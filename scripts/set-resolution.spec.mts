import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

test('updates the repository package.json', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'set-resolution-'));
  const projectRoot = join(fixtureRoot, 'project');
  const scriptsDirectory = join(projectRoot, 'scripts');
  const packageJsonPath = join(projectRoot, 'package.json');

  try {
    await mkdir(scriptsDirectory, { recursive: true });
    await copyFile(
      new URL('./set-resolution.mts', import.meta.url),
      join(scriptsDirectory, 'set-resolution.mts'),
    );
    await writeFile(
      packageJsonPath,
      JSON.stringify({ resolutions: { react: '18.3.1' } }),
    );

    await execFileAsync(
      process.execPath,
      ['scripts/set-resolution.mts', 'graphql@16.11.0'],
      { cwd: projectRoot },
    );

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    assert.deepEqual(packageJson.resolutions, {
      graphql: '16.11.0',
      react: '18.3.1',
    });
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
