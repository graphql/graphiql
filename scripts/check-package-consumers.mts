import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'graphiql-package-consumers-'));
const selected = new Set([
  'graphiql',
  '@graphiql/toolkit',
  'codemirror-graphql',
  'monaco-graphql',
  'graphql-language-service',
  'graphql-language-service-server',
  'graphql-language-service-cli',
]);
const packages = new Map<
  string,
  { directory: string; dependencies?: Record<string, string> }
>();
const environment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !/^(npm_config_|pnpm_)/i.test(key),
  ),
);

async function run(command: string, args: string[], cwd: string) {
  try {
    return await exec(command, args, {
      cwd,
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...environment, NODE_PATH: '' },
    });
  } catch (error) {
    const output = error as { stdout?: string; stderr?: string };
    process.stderr.write(output.stdout ?? '');
    process.stderr.write(output.stderr ?? '');
    throw error;
  }
}

try {
  for (const entry of await readdir(join(root, 'packages'), {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const directory = join(root, 'packages', entry.name);
    const filepath = join(directory, 'package.json');
    const manifest = JSON.parse(await readFile(filepath, 'utf8'));
    if (!manifest.private) {
      packages.set(manifest.name, {
        directory,
        dependencies: manifest.dependencies,
      });
    }
  }
  for (const name of selected) {
    const manifest = packages.get(name);
    assert.ok(manifest, `Missing workspace package ${name}`);
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      if (packages.has(dependency)) {
        selected.add(dependency);
      }
    }
  }

  const packed: Record<string, string> = {};
  for (const name of selected) {
    const { stdout } = await run(
      'npm',
      ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary],
      packages.get(name)!.directory,
    );
    const [{ filename }] = JSON.parse(stdout);
    packed[name] = `file:${join(temporary, filename)}`;
  }

  for (const react of ['18.3.1', '19.3.1']) {
    for (const graphql of ['16.14.2', '17.0.2']) {
      console.info(
        `Checking packed packages: Node ${process.versions.node}, React ${react}, GraphQL ${graphql}`,
      );
      const directory = join(temporary, `react-${react}-graphql-${graphql}`);
      await cp(
        new URL('./fixtures/package-consumer/', import.meta.url),
        directory,
        { recursive: true },
      );
      await cp(
        new URL('./fixtures/codemirror-consumer.ts', import.meta.url),
        join(directory, 'codemirror-consumer.ts'),
      );
      await writeFile(
        join(directory, 'package.json'),
        JSON.stringify({
          private: true,
          dependencies: { ...packed, react, 'react-dom': react, graphql },
          devDependencies: {
            typescript: '5.9.3',
            '@types/react': react.startsWith('18') ? '^18.3.0' : '^19.0.0',
            '@types/react-dom': react.startsWith('18') ? '^18.3.0' : '^19.0.0',
          },
          overrides: Object.fromEntries(
            [...selected].map(name => [name, `$${name}`]),
          ),
        }),
      );
      await run(
        'npm',
        [
          'install',
          '--ignore-scripts',
          '--no-audit',
          '--no-fund',
          '--engine-strict',
          '--prefer-online',
          '--include=dev',
        ],
        directory,
      );
      await run(
        process.execPath,
        ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'],
        directory,
      );
      await run(process.execPath, ['consumer.mjs'], directory);
      const cli = 'node_modules/graphql-language-service-cli/bin/graphql.js';
      const help = await run(process.execPath, [cli, '--help'], directory);
      assert.match(help.stdout, /autocomplete/);
      const validation = await run(
        process.execPath,
        [cli, 'validate', '--text', '{ __typename }'],
        directory,
      );
      assert.equal(validation.stdout, '{}');
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
