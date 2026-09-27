import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import {
  access,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Manifest = {
  name: string;
  version: string;
  private?: boolean;
  main?: string;
  module?: string;
  types?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'graphiql-packages-'));
const manifests = new Map<string, { manifest: Manifest; directory: string }>();
const archives = new Map<string, { manifest: Manifest; archive: string }>();

async function run(command: string, args: string[], cwd = root) {
  const child = spawn(command, args, { cwd, env: process.env });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', data => {
    stdout += data;
  });
  child.stderr.on('data', data => {
    stderr += data;
  });
  const code = await new Promise<number | null>((accept, reject) => {
    child.on('error', reject);
    child.on('close', accept);
  });
  assert.equal(
    code,
    0,
    `${command} ${args.join(' ')} failed:\n${stdout}${stderr}`,
  );
  return { stdout, stderr };
}

const registry = createServer((request, response) => {
  void (async () => {
    const path = decodeURIComponent(
      new URL(request.url!, 'http://localhost').pathname,
    );
    if (path.startsWith('/archives/')) {
      const packed = archives.get(path.slice('/archives/'.length));
      assert.ok(packed, `Unknown archive ${path}`);
      response.end(await readFile(packed.archive));
      return;
    }
    const packed = archives.get(path.slice(1));
    if (!packed) {
      response.writeHead(302, {
        location: `https://registry.npmjs.org${request.url}`,
      });
      response.end();
      return;
    }
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        name: packed.manifest.name,
        'dist-tags': { latest: packed.manifest.version },
        versions: {
          [packed.manifest.version]: {
            ...packed.manifest,
            dist: {
              tarball: `${registryUrl}/archives/${encodeURIComponent(packed.manifest.name)}`,
            },
          },
        },
      }),
    );
  })().catch(error => {
    response.statusCode = 500;
    response.end(String(error));
  });
});
let registryUrl = '';

try {
  for (const entry of await readdir(join(root, 'packages'))) {
    const directory = join(root, 'packages', entry);
    const manifest: Manifest = JSON.parse(
      await readFile(join(directory, 'package.json'), 'utf8'),
    );
    manifests.set(manifest.name, { manifest, directory });
  }

  for (const { manifest } of manifests.values()) {
    for (const [dependency, range] of Object.entries({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      const internal = manifests.get(dependency);
      if (internal && range.includes('-beta.')) {
        assert.equal(
          range,
          internal.manifest.version,
          `${manifest.name} must pin internal prerelease ${dependency}`,
        );
      }
    }
  }

  // Follow the same package family that a fresh GraphiQL install needs.
  const family = new Set(['graphiql']);
  for (const name of family) {
    const { manifest, directory } = manifests.get(name)!;
    for (const [dependency, range] of Object.entries({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      const internal = manifests.get(dependency);
      if (!internal || internal.manifest.private) {
        continue;
      }
      if (internal.manifest.version.includes('-')) {
        assert.equal(
          range,
          internal.manifest.version,
          `${name} must pin internal prerelease ${dependency}`,
        );
      }
      family.add(dependency);
    }
    const packOutput = JSON.parse(
      (
        await run(
          'npm',
          [
            'pack',
            '--ignore-scripts',
            '--json',
            '--pack-destination',
            temporary,
          ],
          directory,
        )
      ).stdout,
    );
    const archive = join(temporary, packOutput[0].filename);
    const extracted = join(temporary, name.replaceAll('/', '-'));
    await mkdir(extracted);
    await run('tar', ['-xzf', archive, '-C', extracted]);
    const packedRoot = join(extracted, 'package');
    const packedManifest: Manifest = JSON.parse(
      await readFile(join(packedRoot, 'package.json'), 'utf8'),
    );
    for (const entryPoint of [
      packedManifest.main,
      packedManifest.module,
      packedManifest.types,
    ]) {
      if (entryPoint) {
        await access(join(packedRoot, entryPoint));
      }
    }
    archives.set(name, { manifest: packedManifest, archive });
    if (name === 'monaco-graphql') {
      await access(join(packedRoot, 'esm/graphql.worker.js.map'));
      for (const output of ['esm', 'dist']) {
        for (const filename of await readdir(join(packedRoot, output), {
          recursive: true,
        })) {
          if (!filename.endsWith('.map')) {
            continue;
          }
          const mapFile = join(packedRoot, output, filename);
          const map = JSON.parse(await readFile(mapFile, 'utf8'));
          for (const [index, source] of map.sources.entries()) {
            if (map.sourcesContent?.[index] == null) {
              const sourcePath = resolve(
                dirname(mapFile),
                map.sourceRoot || '',
                source,
              );
              assert.ok(
                sourcePath.startsWith(`${packedRoot}/`),
                `${mapFile} references an unpublished source`,
              );
              await access(sourcePath);
            }
          }
        }
      }
    }
  }

  await new Promise<void>(accept => registry.listen(0, '127.0.0.1', accept));
  const address = registry.address();
  assert.ok(address && typeof address !== 'string');
  registryUrl = `http://127.0.0.1:${address.port}`;
  const consumer = join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(join(consumer, '.npmrc'), `registry=${registryUrl}\n`);
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        graphiql: manifests.get('graphiql')!.manifest.version,
        graphql: '16.14.2',
        react: '19.2.7',
        'react-dom': '19.2.7',
      },
    }),
  );
  await run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      `--registry=${registryUrl}`,
    ],
    consumer,
  );
  const require = createRequire(join(consumer, 'package.json'));
  for (const name of family) {
    const installed: Manifest = JSON.parse(
      await readFile(
        join(consumer, 'node_modules', name, 'package.json'),
        'utf8',
      ),
    );
    assert.equal(
      installed.version,
      manifests.get(name)!.manifest.version,
      `${name} selected an incompatible version`,
    );
    console.log(`${name}@${installed.version}`);
  }
  for (const path of [
    'monaco-graphql/esm/graphql.worker.js',
    'monaco-graphql/esm/lite.js',
  ]) {
    require.resolve(path);
  }
  assert.equal(
    typeof require('graphql-language-service').getContextAtPosition,
    'function',
  );
  const declarations = await readFile(
    join(consumer, 'node_modules/@graphiql/plugin-collections/dist/index.d.ts'),
    'utf8',
  );
  assert.match(declarations, /export declare const COLLECTIONS_PLUGIN/);

  await writeFile(
    join(consumer, 'index.html'),
    '<div id="app"></div><script type="module" src="/main.ts"></script>',
  );
  await writeFile(
    join(consumer, 'main.ts'),
    `
import 'graphiql/setup-workers/vite';
import { GraphiQL } from 'graphiql';
import { COLLECTIONS_PLUGIN, collectionsPlugin } from '@graphiql/plugin-collections';
import type { GraphiQLPlugin } from '@graphiql/react';
import { getContextAtPosition } from 'graphql-language-service';
const plugin: GraphiQLPlugin = COLLECTIONS_PLUGIN;
Object.assign(globalThis, { GraphiQL, plugin, collectionsPlugin, getContextAtPosition });
`,
  );
  await writeFile(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        lib: ['ES2022', 'DOM'],
      },
      include: ['main.ts'],
    }),
  );
  await run(join(root, 'node_modules/.bin/tsgo'), [
    '-p',
    join(consumer, 'tsconfig.json'),
  ]);
  const build = await run(
    join(root, 'packages/graphiql-react/node_modules/.bin/vite'),
    ['build', consumer],
    consumer,
  );
  assert.doesNotMatch(
    build.stdout + build.stderr,
    /Sourcemap.*missing source|ENOENT.*monaco-graphql/i,
  );
  console.log(
    'Packed package entries, exports, source maps, fresh install, types, and Vite workers verified.',
  );
} finally {
  if (registry.listening) {
    await new Promise<void>(accept => registry.close(() => accept()));
  }
  if (process.argv.includes('--keep')) {
    console.log(`Packed consumer: ${join(temporary, 'consumer')}`);
  } else {
    await rm(temporary, { recursive: true, force: true });
  }
}
