#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, open, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

function readArguments(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, '');
    const value = argv[index + 1];
    if (!key || value === undefined) {
      throw new Error(`Invalid argument: ${argv[index] ?? ''}`);
    }
    options[key] = value;
  }

  const target = options.target;
  const spec = options.spec;
  const output = options.output;
  const repeats = Number(options.repeats ?? 20);

  if (!['source', 'built'].includes(target)) {
    throw new Error('--target must be "source" or "built".');
  }
  if (!spec || !output) {
    throw new Error('--spec and --output are required.');
  }
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 50) {
    throw new Error('--repeats must be an integer between 1 and 50.');
  }

  return { target, spec, output: path.resolve(output), repeats };
}

function run(command, args, options = {}) {
  return new Promise(resolve => {
    const child = spawn(command, args, options);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function waitFor(url, server) {
  const deadline = Date.now() + 120_000;
  let lastError;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`The test server exited with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`${url} returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Timed out waiting for ${url}: ${lastError?.message ?? 'unknown error'}`,
  );
}

function normalizeFailure(output) {
  const ansiEscape = new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, 'g');
  const clean = output.replaceAll(ansiEscape, '');
  const lines = clean
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const patterns = [
    /(?:AssertionError|CypressError|TypeError|ReferenceError|Error):\s+.+/,
    /Timed out retrying[^\n]*/,
    /The following error originated from your application code[^\n]*/,
  ];

  let signature = '';
  for (const pattern of patterns) {
    const line = lines.find(candidate => pattern.test(candidate));
    if (line) {
      signature = line.match(pattern)?.[0] ?? line;
      break;
    }
  }

  signature ||= lines.at(-1) ?? 'Cypress exited without a diagnostic';

  signature = signature
    .replaceAll(process.cwd(), '<workspace>')
    .replaceAll(/https?:\/\/[^\s)]+/g, '<url>')
    .replaceAll(
      /\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?|seconds?|s)\b/gi,
      '<duration>',
    )
    .replaceAll(/:\d+:\d+\b/g, ':<line>:<column>')
    .replaceAll(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '<uuid>')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, 500);

  return {
    signature,
    signatureHash: createHash('sha256')
      .update(signature)
      .digest('hex')
      .slice(0, 12),
  };
}

async function stopServer(server) {
  if (server.exitCode !== null || !server.pid) {
    return;
  }

  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }

  await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ]);

  if (server.exitCode === null) {
    try {
      process.kill(-server.pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') {
        throw error;
      }
    }
  }
}

const options = readArguments(process.argv.slice(2));
await mkdir(options.output, { recursive: true });
const serverLog = await open(path.join(options.output, 'server.log'), 'w');
const serverCommand =
  options.target === 'source' ? 'start:source' : 'server:built';
const server = spawn('pnpm', ['--filter', 'graphiql-e2e', serverCommand], {
  detached: true,
  env: process.env,
  stdio: ['ignore', serverLog.fd, serverLog.fd],
});

const result = {
  target: options.target,
  spec: options.spec,
  repeats: options.repeats,
  failures: [],
};

try {
  const healthUrls =
    options.target === 'source'
      ? [
          'http://localhost:5173',
          'http://localhost:8080/graphql?query=%7Btest%20%7Bid%7D%7D',
        ]
      : ['http://localhost:8080'];
  await Promise.all(healthUrls.map(url => waitFor(url, server)));

  for (let iteration = 1; iteration <= options.repeats; iteration += 1) {
    const iterationDirectory = path.join(
      options.output,
      `iteration-${String(iteration).padStart(2, '0')}`,
    );
    await mkdir(iterationDirectory, { recursive: true });
    const logPath = path.join(iterationDirectory, 'cypress.log');
    const log = await open(logPath, 'w');
    process.stdout.write(
      `[${options.target}] ${options.spec} (${iteration}/${options.repeats})\n`,
    );

    const execution = await run(
      'pnpm',
      [
        '--filter',
        'graphiql-e2e',
        'exec',
        'cypress',
        'run',
        '--browser',
        'electron',
        '--spec',
        options.spec,
        '--config',
        `video=true,videosFolder=${path.join(iterationDirectory, 'videos')},screenshotsFolder=${path.join(iterationDirectory, 'screenshots')}`,
      ],
      {
        env: {
          ...process.env,
          GRAPHIQL_E2E_TARGET: options.target,
          ELECTRON_EXTRA_LAUNCH_ARGS: '--disable-gpu',
        },
        stdio: ['ignore', log.fd, log.fd],
      },
    );
    await log.close();

    if (execution.code !== 0) {
      const output = await readFile(logPath, 'utf8');
      result.failures.push({
        iteration,
        exitCode: execution.code,
        signal: execution.signal,
        log: path.relative(options.output, logPath),
        ...normalizeFailure(output),
      });
    } else {
      await rm(iterationDirectory, { recursive: true });
    }
  }
} catch (error) {
  const diagnostic =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  const normalized = normalizeFailure(diagnostic);
  result.failures.push({
    iteration: 0,
    exitCode: null,
    signal: null,
    log: 'server.log',
    ...normalized,
  });
} finally {
  await stopServer(server);
  await serverLog.close();
  await writeFile(
    path.join(options.output, 'result.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );
}

if (result.failures.length > 0) {
  process.exitCode = 1;
}
