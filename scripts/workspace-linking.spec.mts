import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('prefers local packages while versioning prereleases', async () => {
  const contents = await readFile(
    new URL('../pnpm-workspace.yaml', import.meta.url),
    'utf8',
  );

  assert.match(contents, /^preferWorkspacePackages: true$/m);
});
