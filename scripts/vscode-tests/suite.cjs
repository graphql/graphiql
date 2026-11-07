/* oxlint-disable unicorn/prefer-node-protocol */
// The test driver must load on VS Code 1.63's Node 14.16 runtime.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const vscode = require('vscode');

const workspace = process.env.GRAPHIQL_TEST_WORKSPACE;
const report = {
  vscode: vscode.version,
  mode: process.env.GRAPHIQL_TEST_MODE,
  transport: process.env.GRAPHIQL_TEST_TRANSPORT,
  host: { pid: process.pid, versions: process.versions },
  extensions: [],
  checks: [],
  limitations: [],
};

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

async function poll(description, callback, timeout = 30000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const result = await callback();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(150);
  }
  throw new Error(
    `Timed out: ${description}${lastError ? ` (${lastError.message})` : ''}`,
  );
}

async function check(name, callback) {
  const started = Date.now();
  let timer;
  try {
    await Promise.race([
      callback(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timed out check: ${name}`)),
          45000,
        );
      }),
    ]);
    report.checks.push({
      name,
      status: 'passed',
      durationMs: Date.now() - started,
    });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, status: 'failed', error: error.stack });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function installedExtension(id) {
  const extension = vscode.extensions.getExtension(id);
  assert.ok(extension, `${id} must be installed from its VSIX`);
  const installed = fs.realpathSync(process.env.GRAPHIQL_TEST_EXTENSIONS_DIR);
  const actual = fs.realpathSync(extension.extensionPath);
  const relative = path.relative(installed, actual);
  assert.ok(
    relative && !relative.startsWith('..') && !path.isAbsolute(relative),
    `${id} resolved outside the isolated installed extensions: ${actual}`,
  );
  report.extensions.push({
    id,
    version: extension.packageJSON.version,
    engines: extension.packageJSON.engines.vscode,
    path: actual,
  });
  return extension;
}

async function open(name) {
  const document = await vscode.workspace.openTextDocument(
    path.join(workspace, name),
  );
  await vscode.window.showTextDocument(document);
  return document;
}

async function completion(document, marker, expected) {
  const offset = document.getText().indexOf(marker);
  assert.ok(offset >= 0, `Missing cursor marker ${marker}`);
  return poll(
    `completion ${expected} in ${path.basename(document.fileName)}`,
    async () => {
      const result = await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        document.uri,
        document.positionAt(offset + marker.length),
      );
      return (
        result &&
        result.items.some(
          item =>
            (typeof item.label === 'string' ? item.label : item.label.label) ===
            expected,
        )
      );
    },
  );
}

async function getState() {
  const url = process.env.GRAPHIQL_TEST_SERVER_URL.replace(
    '/graphql',
    '/__state',
  );
  return new Promise((resolve, reject) => {
    http
      .get(url, response => {
        let body = '';
        response.on('data', bytes => {
          body += bytes;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

async function syntax() {
  const extension = installedExtension('GraphQL.vscode-graphql-syntax');
  await check('packaged syntax contributions', async () => {
    const contributions = extension.packageJSON.contributes;
    assert.ok(
      contributions.languages.some(
        contribution => contribution.id === 'graphql',
      ),
    );
    for (const grammar of contributions.grammars) {
      const grammarPath = path.join(extension.extensionPath, grammar.path);
      assert.ok(JSON.parse(fs.readFileSync(grammarPath, 'utf8')).scopeName);
    }
    for (const contribution of contributions.languages) {
      if (contribution.configuration) {
        assert.ok(
          fs.existsSync(
            path.join(extension.extensionPath, contribution.configuration),
          ),
        );
      }
    }
    const document = await open('operation.graphql');
    assert.strictEqual(document.languageId, 'graphql');
  });
}

async function language() {
  const extension = installedExtension('GraphQL.vscode-graphql');
  await check('language extension activation', async () => {
    await open('completion.graphql');
    await poll(
      'natural language extension activation',
      () => extension.isActive,
    );
  });
  await check('config/schema loading and GraphQL completion', async () => {
    await completion(await open('completion.graphql'), 'gre', 'greeting');
  });
  await check('GraphQL diagnostics', async () => {
    const document = await open('invalid.graphql');
    await poll('unknown field diagnostic', () =>
      vscode.languages
        .getDiagnostics(document.uri)
        .some(diagnostic => diagnostic.message.includes('missingField')),
    );
  });
  await check('embedded TypeScript GraphQL completion', async () => {
    await completion(await open('embedded.ts'), 'na', 'name');
  });
  for (const format of ['vue', 'svelte', 'astro']) {
    await check(`embedded ${format} GraphQL completion`, async () => {
      const document = await open(`embedded.${format}`);
      assert.strictEqual(document.languageId, format);
      await completion(document, 'na', 'name');
    });
  }
  await check('schema file watching', async () => {
    const filename = path.join(workspace, 'watched.graphql');
    fs.writeFileSync(filename, 'query RuntimeWatch { watchedGree }\n');
    const document = await open('watched.graphql');
    const schemaPath = path.join(workspace, 'schema.graphql');
    const source = fs.readFileSync(schemaPath, 'utf8');
    fs.writeFileSync(
      schemaPath,
      source.replace('type Query {', 'type Query {\n  watchedGreeting: String'),
    );
    await completion(document, 'watchedGree', 'watchedGreeting');
  });
  await check('server restart with remote schema configuration', async () => {
    const configPath = path.join(workspace, 'graphql.config.js');
    const config = fs.readFileSync(configPath, 'utf8');
    fs.writeFileSync(
      configPath,
      config.replace(
        "'./schema.graphql'",
        JSON.stringify(process.env.GRAPHIQL_TEST_SERVER_URL),
      ),
    );
    await vscode.commands.executeCommand('vscode-graphql.restart');
    await completion(await open('completion.graphql'), 'gre', 'greeting');
    await poll('remote schema introspection', async () => {
      const state = await getState();
      return state.requests.some(
        request => request.query.includes('__schema') && !request.result.errors,
      );
    });
    const versions = runtimeVersions();
    assert.ok(
      versions.some(runtime => runtime.pid !== process.pid),
      'Must record the real language server runtime',
    );
  });
}

async function executeDocument(name) {
  const document = await open(name);
  const lens = await poll(`execution CodeLens in ${name}`, async () => {
    const lenses = await vscode.commands.executeCommand(
      'vscode.executeCodeLensProvider',
      document.uri,
    );
    return (
      lenses &&
      lenses.find(
        item =>
          item.command &&
          item.command.command === 'vscode-graphql-execution.contentProvider',
      )
    );
  });
  await vscode.commands.executeCommand(
    lens.command.command,
    ...lens.command.arguments,
  );
}

async function execution() {
  const extension = installedExtension('GraphQL.vscode-graphql-execution');
  await check('execution extension activation', async () => {
    await open('operation.graphql');
    await poll(
      'natural execution extension activation',
      () => extension.isActive,
    );
  });
  await check(
    'CodeLens HTTP execution with remote config and local fragments',
    async () => {
      await executeDocument('operation.graphql');
      await poll('successful execution with local fragment', async () => {
        const state = await getState();
        return state.requests.some(
          request =>
            request.query.includes('RuntimeQuery') &&
            request.query.includes('fragment GreetingFields') &&
            !request.result.errors &&
            request.result.data.greeting ===
              'hello from the packaged extension',
        );
      });
      await poll('rendered execution response', async () => {
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.parse('graphql://authority/graphql'),
        );
        return document.getText().includes('hello from the packaged extension');
      });
    },
  );
  await check('WebSocket subscription connection and delivery', async () => {
    await executeDocument('subscription.graphql');
    await poll('subscription request', async () => {
      const state = await getState();
      return state.subscriptions.some(subscription =>
        subscription.query.includes('RuntimeSubscription'),
      );
    });
    await poll('rendered subscription response', async () => {
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.parse('graphql://authority/graphql'),
      );
      return document.getText().includes('"counter": 1');
    });
  });
  await check('subscription panel close observation', async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await delay(1000);
    const state = await getState();
    report.subscriptionPanelClose = {
      cancelled: state.cancellations.length > 0,
    };
    if (!report.subscriptionPanelClose.cancelled) {
      report.limitations.push(
        'Closing the results panel does not cancel the subscription. The execution extension currently discards its subscription disposer; this is separate from runtime compatibility.',
      );
    }
  });
}

function runtimeVersions() {
  const filename = path.join(workspace, 'runtime-versions.jsonl');
  if (!fs.existsSync(filename)) {
    return [];
  }
  return fs
    .readFileSync(filename, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

async function run() {
  try {
    assert.ok(workspace, 'GRAPHIQL_TEST_WORKSPACE is required');
    assert.strictEqual(
      path.relative(workspace, vscode.workspace.workspaceFolders[0].uri.fsPath),
      '',
    );
    await syntax();
    if (report.mode === 'language') {
      await language();
    } else if (report.mode === 'execution') {
      await execution();
    } else {
      assert.strictEqual(report.mode, 'syntax');
    }
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.error = error.stack;
    throw error;
  } finally {
    report.configRuntimes = workspace ? runtimeVersions() : [];
    if (process.env.GRAPHIQL_TEST_REPORT) {
      fs.writeFileSync(
        process.env.GRAPHIQL_TEST_REPORT,
        JSON.stringify(report, null, 2) + '\n',
      );
    }
  }
}

module.exports = { run };
