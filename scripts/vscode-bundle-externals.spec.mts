import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

for (const bundle of ['vscode-graphql', 'vscode-graphql-execution']) {
  test(`${bundle} externalizes the optional React renderers`, async () => {
    const contents = await readFile(
      new URL(`../packages/${bundle}/esbuild.js`, import.meta.url),
      'utf8',
    );

    for (const dependency of ['react', 'react-dom/server']) {
      assert.match(contents, new RegExp(`^    '${dependency}',?$`, 'm'));
    }
  });
}
