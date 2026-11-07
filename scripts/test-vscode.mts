import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({
  options: {
    version: { type: 'string', default: 'minimum' },
    extension: { type: 'string', default: 'all' },
    'artifacts-dir': { type: 'string', default: 'out/vsix' },
    'output-dir': { type: 'string', default: 'out/vscode-tests' },
    'package-only': { type: 'boolean', default: false },
    published: { type: 'boolean', default: false },
  },
});
const modes = ['syntax', 'language', 'execution'] as const;
type Mode = (typeof modes)[number];
const names: Record<Mode, string> = {
  syntax: 'vscode-graphql-syntax',
  language: 'vscode-graphql',
  execution: 'vscode-graphql-execution',
};
const artifacts = resolve(root, values['artifacts-dir']);
const output = resolve(root, values['output-dir']);
const exec = promisify(execFile);
const manifests = Object.fromEntries(
  await Promise.all(
    modes.map(async mode => [
      mode,
      JSON.parse(
        await readFile(
          join(root, 'packages', names[mode], 'package.json'),
          'utf8',
        ),
      ),
    ]),
  ),
) as Record<
  Mode,
  { name: string; version: string; engines: { vscode: string } }
>;
let selected: Mode[] =
  values.extension === 'all'
    ? [...modes]
    : values.extension === 'runtime'
      ? ['language', 'execution']
      : [values.extension as Mode];
if (!selected.every(mode => modes.includes(mode))) {
  throw new Error(`Unknown extension: ${values.extension}`);
}
if (values.published) {
  const published = JSON.parse(process.env.PUBLISHED_PACKAGES ?? '[]') as {
    name: string;
  }[];
  selected = selected.filter(mode =>
    published.some(pkg => pkg.name === names[mode]),
  );
}
await mkdir(output, { recursive: true });

async function run(
  command: string,
  args: string[],
  cwd = root,
  environment: NodeJS.ProcessEnv = {},
) {
  try {
    return await exec(command, args, {
      cwd,
      timeout: 180_000,
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, NODE_PATH: '', ...environment },
      windowsHide: true,
    });
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string };
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw error;
  }
}

async function artifact(mode: Mode) {
  const filename = `${names[mode]}-${manifests[mode].version}.vsix`;
  for (const path of [
    join(artifacts, filename),
    join(artifacts, names[mode], filename),
  ]) {
    try {
      const bytes = await readFile(path);
      return { path, sha256: createHash('sha256').update(bytes).digest('hex') };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  throw new Error(`Missing packaged artifact ${filename} in ${artifacts}`);
}

if (values['package-only']) {
  await mkdir(artifacts, { recursive: true });
  for (const mode of new Set([
    ...selected,
    ...(selected.some(selectedMode => selectedMode !== 'syntax')
      ? ['syntax' as const]
      : []),
  ])) {
    const directory = join(root, 'packages', names[mode]);
    const pnpm = process.env.npm_execpath;
    if (!pnpm) {
      throw new Error('Run packaging through pnpm test:vscode');
    }
    const result = await run(process.execPath, [
      pnpm,
      '--filter',
      names[mode],
      'vsce:package',
    ]);
    process.stdout.write(result.stdout);
    await cp(
      join(directory, `${names[mode]}-${manifests[mode].version}.vsix`),
      join(artifacts, `${names[mode]}-${manifests[mode].version}.vsix`),
    );
    console.info(await artifact(mode));
  }
  process.exit(0);
}

const sourceSha = (await run('git', ['rev-parse', 'HEAD'])).stdout.trim();
const requireFromExecution = createRequire(
  join(root, 'packages/vscode-graphql-execution/package.json'),
);
const fixture = createRequire(import.meta.url)(
  './vscode-tests/fixture-server.cjs',
);
const results: unknown[] = [];
let failures = 0;
try {
  for (const mode of selected) {
    const requestedVersion =
      values.version === 'minimum'
        ? manifests[mode].engines.vscode.replace(/^\^/, '')
        : values.version;
    for (const transport of mode === 'language' ? ['ipc', 'stdio'] : ['ipc']) {
      const label = `${mode}-${requestedVersion}-${transport}-${process.platform}-${process.arch}`;
      const directory = await realpath(
        await mkdtemp(join(tmpdir(), 'graphiql-vsix-')),
      );
      let server: { url: string; close: () => Promise<void> } | undefined;
      const reportPath = join(output, `${label}.json`);
      const driverReportPath = join(directory, 'driver-report.json');
      const workspace = join(directory, 'workspace');
      const extensions = join(directory, 'extensions');
      const profile = join(directory, 'profile');
      const evidence: Record<string, unknown> = {
        sourceSha,
        mode,
        requestedVersion,
        transport,
        platform: process.platform,
        arch: process.arch,
        artifacts: [],
        stage: 'setup',
        status: 'setup-failed',
      };
      try {
        const artifactsToInstall: { path: string; sha256: string }[] = [];
        evidence.artifacts = artifactsToInstall;
        for (const dependency of mode !== 'syntax'
          ? ['syntax' as const, mode]
          : [mode]) {
          artifactsToInstall.push(await artifact(dependency));
        }
        server = await fixture.startFixtureServer({
          graphqlPath: requireFromExecution.resolve('graphql'),
          wsPath: requireFromExecution.resolve('ws'),
        });
        assert.ok(server);
        await cp(join(root, 'scripts/vscode-tests/fixtures'), workspace, {
          recursive: true,
        });
        await mkdir(extensions, { recursive: true });
        await mkdir(join(workspace, '.vscode'), { recursive: true });
        await writeFile(
          join(workspace, '.vscode/settings.json'),
          JSON.stringify({
            'vscode-graphql.transport': transport,
            'security.workspace.trust.enabled': false,
          }),
        );
        evidence.stage = 'download';
        evidence.status = 'download-failed';
        const executable = await downloadAndUnzipVSCode({
          version: requestedVersion,
          cachePath: join(root, '.vscode-test'),
        });
        evidence.stage = 'install';
        evidence.status = 'install-failed';
        for (const vsix of artifactsToInstall) {
          // Invoke the CLI directly: older macOS launch scripts require Python 2.
          const cli =
            process.platform === 'darwin'
              ? join(dirname(dirname(executable)), 'Resources/app/out/cli.js')
              : join(dirname(executable), 'resources/app/out/cli.js');
          const result = await run(
            executable,
            [
              cli,
              '--user-data-dir',
              profile,
              '--extensions-dir',
              extensions,
              '--install-extension',
              vsix.path,
              '--force',
            ],
            directory,
            { ELECTRON_RUN_AS_NODE: '1' },
          );
          process.stdout.write(result.stdout);
        }
        evidence.stage = 'host-starting';
        evidence.status = 'host-launch-failed';
        await runTests({
          vscodeExecutablePath: executable,
          extensionDevelopmentPath: join(root, 'scripts/vscode-tests/driver'),
          extensionTestsPath: join(root, 'scripts/vscode-tests/suite.cjs'),
          extensionTestsEnv: {
            GRAPHIQL_TEST_EXTENSIONS_DIR: extensions,
            GRAPHIQL_TEST_WORKSPACE: workspace,
            GRAPHIQL_TEST_MODE: mode,
            GRAPHIQL_TEST_TRANSPORT: transport,
            GRAPHIQL_TEST_REPORT: driverReportPath,
            GRAPHIQL_TEST_SERVER_URL: server.url,
            NODE_PATH: '',
          },
          launchArgs: [
            workspace,
            '--user-data-dir',
            profile,
            '--extensions-dir',
            extensions,
            '--disable-workspace-trust',
            '--skip-welcome',
            '--skip-release-notes',
            '--disable-updates',
            '--disable-gpu',
            '--no-sandbox',
          ],
        });
        evidence.stage = 'result-validation';
        evidence.status = 'result-validation-failed';
        const completed = JSON.parse(await readFile(driverReportPath, 'utf8'));
        assert.equal(
          completed.status,
          'passed',
          'Test driver did not complete',
        );
        if (requestedVersion !== 'stable' && requestedVersion !== 'insiders') {
          assert.equal(
            completed.vscode,
            requestedVersion,
            'Wrong editor version tested',
          );
        }
        if (values.version === 'minimum') {
          const subject = completed.extensions.find(
            (extension: { id: string }) =>
              extension.id === `GraphQL.${names[mode]}`,
          );
          assert.equal(
            subject?.engines,
            manifests[mode].engines.vscode,
            'Packaged minimum differs from source manifest',
          );
        }
        evidence.stage = 'completed';
        evidence.status = 'passed';
      } catch (error) {
        failures++;
        const failure = error as Error & {
          code?: string | number;
          signal?: string;
          stderr?: string;
        };
        evidence.error = {
          message: failure.message,
          code: failure.code,
          signal: failure.signal,
          stderr: failure.stderr,
        };
        console.error(`${label}: ${error}`);
        await cp(join(profile, 'logs'), join(output, `${label}-logs`), {
          recursive: true,
        }).catch(() => {});
      } finally {
        const driver = await readFile(driverReportPath, 'utf8')
          .then(JSON.parse)
          .catch(() => {});
        if (driver?.status === 'failed') {
          evidence.stage = 'extension-tests';
          evidence.status = 'extension-test-failed';
        } else if (
          driver?.status === 'passed' &&
          evidence.status !== 'passed'
        ) {
          evidence.stage = 'result-validation';
          evidence.status = 'result-validation-failed';
        }
        const runtimes = await readFile(
          join(workspace, 'runtime-versions.jsonl'),
          'utf8',
        ).catch(() => '');
        const report = {
          ...evidence,
          driver,
          runtimes: runtimes
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line)),
        };
        await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
        results.push({ report: basename(reportPath), ...report });
        await server?.close();
        await rm(directory, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 200,
        });
      }
    }
  }
} finally {
  await writeFile(
    join(
      output,
      `summary-${values.extension}-${values.version}-${process.platform}-${process.arch}.json`,
    ),
    JSON.stringify(results, null, 2) + '\n',
  );
}
if (failures) {
  process.exitCode = 1;
}
