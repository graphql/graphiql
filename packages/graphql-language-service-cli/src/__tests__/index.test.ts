import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import packageJSON from '../../package.json' with { type: 'json' };

const cliPath = fileURLToPath(new URL('../../bin/graphql.js', import.meta.url));

function run(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    timeout: 10_000,
  });
}

describe('command-line arguments', { timeout: 15_000 }, () => {
  it('shows commands and options in help', () => {
    const result = run('--help');
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    for (const command of ['server', 'validate', 'autocomplete', 'outline']) {
      expect(result.stdout).toContain(command);
    }
    for (const option of [
      '--configDir',
      '--text',
      '--file',
      '--method',
      '--port',
    ]) {
      expect(result.stdout).toContain(option);
    }
  });

  it('shows the package version', () => {
    const result = run('--version');
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJSON.version);
    expect(result.stderr).toBe('');
  });

  it.each([
    { args: [], message: 'At least one command is required.' },
    { args: ['validte'], message: 'Did you mean validate?' }, // cspell:ignore validte
    { args: ['validate', '--unknown'], message: 'Unknown argument: unknown' },
  ])('rejects $args with a useful error', ({ args, message }) => {
    const result = run(...args);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
  });

  it('accepts aliases and gives text precedence over the file', () => {
    const result = run(
      'validate',
      '-f',
      '/does/not/exist',
      '-t',
      '{ __typename }',
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('{}');
    expect(result.stderr).toBe('');
  });

  it('preserves client error output and exit status', () => {
    const result = run(
      'autocomplete',
      '--text',
      '{',
      '--schemaPath',
      '/does/not/exist.graphql',
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ENOENT');
  });

  it('passes the selected transport to the server', () => {
    const result = run('server', '--method', 'socket');
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(
      '--port is required to establish socket connection.',
    );
  });
});
