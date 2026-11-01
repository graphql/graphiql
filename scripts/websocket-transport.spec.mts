import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

const requireFromExtension = createRequire(
  new URL('../packages/vscode-graphql-execution/package.json', import.meta.url),
);
const { build } = requireFromExtension('esbuild');
const { WebSocketServer } = requireFromExtension('ws');
const { useServer } = requireFromExtension('graphql-ws/use/ws');
const { buildSchema } = requireFromExtension('graphql');

async function waitFor(check: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) {
      return;
    }
    await delay(20);
  }
  assert.ok(check(), 'the subscription lifecycle completes');
}

test('the bundled execution transport subscribes and cancels cleanly', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'graphiql-websocket-'));
  const httpServer = createServer();
  const websocketServer = new WebSocketServer({ server: httpServer });
  const schema = buildSchema(
    'type Query { ping: Int } type Subscription { ticks: Int! }',
  );
  let connected = 0;
  let cancelled = 0;
  let disconnected = 0;
  const cleanup = useServer(
    {
      schema,
      roots: {
        subscription: {
          ticks() {
            let done = false;
            let tick = 0;
            return {
              [Symbol.asyncIterator]() {
                return this;
              },
              async next() {
                await delay(20);
                return done
                  ? { done: true }
                  : { value: { ticks: ++tick }, done: false };
              },
              async return() {
                done = true;
                cancelled++;
                return { done: true };
              },
            };
          },
        },
      },
      onConnect() {
        connected++;
      },
      onDisconnect() {
        disconnected++;
      },
    },
    websocketServer,
  );
  let unsubscribe: (() => void) | undefined;

  try {
    const bundled = join(temporary, 'network.cjs');
    await build({
      entryPoints: [
        fileURLToPath(
          new URL(
            '../packages/vscode-graphql-execution/src/helpers/network.ts',
            import.meta.url,
          ),
        ),
      ],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: bundled,
      plugins: [
        {
          name: 'extension-host-fixture',
          setup(builder: {
            onResolve: (
              options: { filter: RegExp },
              callback: (args: { path: string }) => {
                path: string;
                namespace: string;
              },
            ) => void;
            onLoad: (
              options: { filter: RegExp; namespace: string },
              callback: (args: { path: string }) => { contents: string },
            ) => void;
          }) {
            builder.onResolve({ filter: /^(vscode|\.\/source)$/ }, args => ({
              path: args.path,
              namespace: 'fixture',
            }));
            builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({
              contents:
                args.path === 'vscode'
                  ? 'export const workspace = {getConfiguration: () => ({rejectUnauthorized: true})};'
                  : 'export const getFragmentDependenciesForAST = async () => [];',
            }));
          },
        },
      ],
    });
    await new Promise<void>(resolve =>
      httpServer.listen(0, '127.0.0.1', resolve),
    );
    const address = httpServer.address();
    assert.ok(address && typeof address !== 'string');
    const { NetworkHelper } = requireFromExtension(bundled);
    const helper = new NetworkHelper({ appendLine() {} }, {});
    const client = helper.buildClient({
      operation: 'subscription',
      endpoint: {
        url: `http://127.0.0.1:${address.port}/graphql`,
        headers: {},
      },
      updateCallback() {},
    });
    const received: number[] = [];
    const errors: unknown[] = [];
    const subscription = client
      .subscription('subscription { ticks }', {})
      .subscribe((result: { data?: { ticks: number }; error?: unknown }) => {
        if (result.error) {
          errors.push(result.error);
        }
        if (result.data) {
          received.push(result.data.ticks);
        }
      });
    unsubscribe = () => subscription.unsubscribe();
    await waitFor(() => received.length >= 2 || errors.length > 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(received.slice(0, 2), [1, 2]);
    assert.equal(connected, 1);
    unsubscribe();
    await waitFor(
      () =>
        cancelled === 1 &&
        disconnected === 1 &&
        websocketServer.clients.size === 0,
    );
  } finally {
    unsubscribe?.();
    for (const socket of websocketServer.clients) {
      socket.terminate();
    }
    await cleanup.dispose();
    await new Promise<void>(resolve => httpServer.close(() => resolve()));
    await rm(temporary, { recursive: true, force: true });
  }
});
