import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const input = `
import { Result } from 'type-only';
export const result: Result = data?.value ?? 42;
export const view = <div />;
`;

async function compile(mode?: 'ESM' | 'CDN') {
  const env = { ...process.env };
  delete env.ESM;
  delete env.CDN;
  if (mode) {
    env[mode] = '1';
  }
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `import { transformAsync } from '@babel/core';
const { code } = await transformAsync(${JSON.stringify(input)}, { filename: 'fixture.tsx' });
process.stdout.write(code);`,
    ],
    { cwd: root, env },
  );
  assert.doesNotMatch(stdout, /type-only/);
  assert.match(stdout, /React\.createElement/);
  return stdout;
}

const globals = () => ({
  data: { value: null },
  React: { createElement: (tag: string) => tag },
});

test('Babel preserves CommonJS output and the classic JSX runtime', async () => {
  const exports: Record<string, unknown> = {};
  runInNewContext(await compile(), { ...globals(), exports });
  assert.equal(exports.result, 42);
  assert.equal(exports.view, 'div');
});

test('Babel preserves ES modules when ESM is enabled', async () => {
  const code = await compile('ESM');
  assert.match(code, /export const result/);
  assert.doesNotMatch(code, /\bexports\b|\brequire\(/);
});

test('Babel preserves browser UMD output when CDN is enabled', async () => {
  const context = {
    ...globals(),
    fixture: undefined as Record<string, unknown> | undefined,
  };
  runInNewContext(await compile('CDN'), context);
  assert.equal(context.fixture?.result, 42);
  assert.equal(context.fixture?.view, 'div');
});
