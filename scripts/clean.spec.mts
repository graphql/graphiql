import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { cleanBuildArtifacts } from './clean.mts';

const artifacts = [
  'packages/library/dist/index.js',
  'packages/library/esm/index.js',
  'packages/library/tsconfig.tsbuildinfo',
  'packages/extension/out/extension.js',
  'examples/app/dist/index.html',
  'examples/app/.next/server.js',
  'examples/app/.react-router/types/index.d.ts',
  'packages/graphiql/webpack/index.html',
  'packages/graphiql/monaco/index.html',
  'packages/graphiql/typedoc/index.html',
  'packages/codemirror-graphql/hint.js',
  'packages/codemirror-graphql/hint.d.ts.map',
  'packages/codemirror-graphql/variables/mode.js',
  'resources/tsconfig.build.cjs.tsbuildinfo',
  'tsconfig.tsbuildinfo',
];

const preserved = [
  'packages/library/src/index.ts',
  'packages/library/node_modules/dependency/dist/index.js',
  'packages/codemirror-graphql/babel.config.js',
  'packages/codemirror-graphql/src/hint.ts',
  '.turbo/cache/build.tar.zst',
  'node_modules/dependency/dist/index.js',
];

test('clean removes generated artifacts and preserves sources, dependencies, and cache', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'graphiql-clean-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of [...artifacts, ...preserved]) {
    const destination = path.join(root, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, 'fixture');
  }

  cleanBuildArtifacts(root);
  cleanBuildArtifacts(root);

  for (const file of artifacts) {
    assert.equal(existsSync(path.join(root, file)), false, file);
  }
  for (const file of preserved) {
    assert.equal(existsSync(path.join(root, file)), true, file);
  }
});

test('bundle cleaning preserves compiled packages', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'graphiql-clean-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of artifacts) {
    const destination = path.join(root, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, 'fixture');
  }

  cleanBuildArtifacts(root, true);

  assert.equal(
    existsSync(path.join(root, 'packages/extension/out/extension.js')),
    false,
  );
  assert.equal(
    existsSync(path.join(root, 'packages/graphiql/webpack/index.html')),
    false,
  );
  assert.equal(
    existsSync(path.join(root, 'packages/library/dist/index.js')),
    true,
  );
});
