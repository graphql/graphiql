import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test, type TestContext } from 'node:test';

function fixture(t: TestContext) {
  const root = mkdtempSync(path.join(tmpdir(), 'graphiql-stage-demo-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'scripts'));
  copyFileSync(
    path.join(import.meta.dirname, 'stage-demo.mts'),
    path.join(root, 'scripts/stage-demo.mts'),
  );
  return root;
}

function stage(root: string, demo: string) {
  return spawnSync(
    process.execPath,
    [path.join(root, 'scripts/stage-demo.mts'), demo],
    {
      cwd: tmpdir(),
      encoding: 'utf8',
    },
  );
}

for (const [demo, example] of [
  ['webpack', 'graphiql-webpack'],
  ['monaco', 'monaco-graphql-webpack'],
]) {
  test(`stages ${demo} assets and replaces stale output`, t => {
    const root = fixture(t);
    const source = path.join(root, 'examples', example, 'dist');
    const destination = path.join(root, 'packages/graphiql', demo);
    mkdirSync(path.join(source, 'assets'), { recursive: true });
    mkdirSync(destination, { recursive: true });
    writeFileSync(path.join(source, 'index.html'), '<html>demo</html>');
    writeFileSync(path.join(source, 'assets/main.js'), 'demo()');
    writeFileSync(path.join(source, '.manifest'), '{}');
    writeFileSync(path.join(destination, 'stale.js'), 'old()');

    const result = stage(root, demo);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      readFileSync(path.join(destination, 'index.html'), 'utf8'),
      '<html>demo</html>',
    );
    assert.equal(
      readFileSync(path.join(destination, 'assets/main.js'), 'utf8'),
      'demo()',
    );
    assert.equal(
      readFileSync(path.join(destination, '.manifest'), 'utf8'),
      '{}',
    );
    assert.equal(existsSync(path.join(destination, 'stale.js')), false);
  });
}

test('preserves staged assets when the build output is missing', t => {
  const root = fixture(t);
  const destination = path.join(root, 'packages/graphiql/webpack');
  mkdirSync(destination, { recursive: true });
  writeFileSync(path.join(destination, 'index.html'), 'existing demo');

  const result = stage(root, 'webpack');

  assert.notEqual(result.status, 0);
  assert.equal(
    readFileSync(path.join(destination, 'index.html'), 'utf8'),
    'existing demo',
  );
});

test('rejects unknown demo targets', t => {
  const root = fixture(t);
  const result = stage(root, '../outside');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Usage: node scripts\/stage-demo.mts/);
});
