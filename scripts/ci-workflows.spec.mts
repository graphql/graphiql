import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

for (const workflow of ['pr.yml', 'pr-graphql-compat-check.yml']) {
  test(`${workflow} installs Cypress from its owning workspace`, async () => {
    const contents = await readFile(
      new URL(`../.github/workflows/${workflow}`, import.meta.url),
      'utf8',
    );

    assert.match(contents, /pnpm --filter graphiql-e2e exec cypress install/);
  });
}
