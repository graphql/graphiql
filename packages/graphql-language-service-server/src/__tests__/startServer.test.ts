import { IPCMessageReader, IPCMessageWriter } from 'vscode-jsonrpc/node';
import { addHandlers, buildOptions, initializeHandlers } from '../startServer';

describe('buildOptions', () => {
  it('should build options', () => {
    const options = buildOptions({});
    expect(options).toEqual({
      loadConfigOptions: {
        extensions: [],
        rootDir: process.cwd(),
      },
    });
  });
  it('should build options with loadConfigOptions', () => {
    const options = buildOptions({ loadConfigOptions: { rootDir: '/root' } });
    expect(options).toEqual({
      loadConfigOptions: {
        rootDir: '/root',
      },
    });
  });
  it('should build options with loadConfigOptions without rootDir', () => {
    const options = buildOptions({ loadConfigOptions: { extensions: [] } });
    expect(options).toEqual({
      loadConfigOptions: {
        rootDir: process.cwd(),
        extensions: [],
      },
    });
  });
  it('should build options with just extensions', () => {
    const options = buildOptions({ extensions: [] });
    expect(options).toEqual({
      extensions: [],
      loadConfigOptions: {
        rootDir: process.cwd(),
        extensions: [],
      },
    });
  });
});

describe('initializeHandlers', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it('should initialize handlers', async () => {
    const reader = new IPCMessageReader(process);
    const writer = new IPCMessageWriter(process);
    const handlers = await initializeHandlers({
      reader,
      writer,
      options: {
        loadConfigOptions: { rootDir: '/root' },
      },
    });
    expect(handlers).toBeDefined();
  });
});

describe('addHandlers', () => {
  it('should add handlers', async () => {
    const connection = {
      onInitialize: vi.fn(),
      onInitialized: vi.fn(),
      onShutdown: vi.fn(),
      onExit: vi.fn(),
      onNotification: vi.fn(),
      onRequest: vi.fn(),
      sendNotification: vi.fn(),
      sendRequest: vi.fn(),
      console: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        log: vi.fn(),
      },
    };

    await addHandlers({
      connection,
      options: { loadConfigOptions: { rootDir: '/root' } },
    });
    expect(
      connection.onNotification.mock.calls.map(c => c[0].method ?? c[0]),
    ).toEqual([
      'textDocument/didOpen',
      'textDocument/didSave',
      'textDocument/didChange',
      'textDocument/didClose',
      'exit',
      '$/cancelRequest',
      'workspace/didChangeWatchedFiles',
      'workspace/didChangeConfiguration',
    ]);
    expect(
      connection.onRequest.mock.calls.map(c => c[0].method ?? c[0]),
    ).toEqual([
      'shutdown',
      'initialize',
      'textDocument/completion',
      'completionItem/resolve',
      'textDocument/definition',
      'textDocument/hover',
      'textDocument/documentSymbol',
      'workspace/symbol',
    ]);
  });
});
