import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { MessageProcessor } from '../../MessageProcessor';
import { Logger as VSCodeLogger } from 'vscode-jsonrpc';
import { URI } from 'vscode-uri';
import { FileChangeType } from 'vscode-languageserver';
import { FileChangeTypeKind } from 'graphql-language-service';

export type MockFile = [filename: string, text: string];

export class MockLogger implements VSCodeLogger {
  error = jest.fn();
  warn = jest.fn();
  info = jest.fn();
  log = jest.fn();
}

type File = [filename: string, text: string];
type Files = File[];

// Track live instances so a process exit handler can clean up any that
// `dispose()` didn't reach (e.g. if a test throws mid-setup).
const liveInstances = new Set<MockProject>();
let exitHandlerRegistered = false;
function registerExitHandler() {
  if (exitHandlerRegistered) {
    return;
  }
  exitHandlerRegistered = true;
  process.on('exit', () => {
    for (const inst of liveInstances) {
      try {
        inst.dispose();
      } catch {
        // best-effort cleanup on exit
      }
    }
  });
}

export class MockProject {
  private root: string;
  private fileCache: Map<string, string>;
  private messageProcessor: MessageProcessor;

  constructor({
    files = [],
    root,
    settings,
  }: {
    files: Files;
    root?: string;
    settings?: Record<string, any>;
  }) {
    registerExitHandler();
    // Unique tmpdir per instance. `gls-test-` prefix makes leaked dirs
    // identifiable across test runs.
    this.root = root ?? fs.mkdtempSync(path.join(tmpdir(), 'gls-test-'));
    this.fileCache = new Map(files);
    liveInstances.add(this);

    this.writeFiles();
    this.messageProcessor = new MessageProcessor({
      connection: {
        get workspace() {
          return {
            async getConfiguration() {
              return settings;
            },
          };
        },
      },
      logger: new MockLogger(),
      loadConfigOptions: {
        rootDir: this.root,
      },
    });
  }

  public async init(filename?: string, fileText?: string) {
    await this.lsp.handleInitializeRequest({
      rootPath: this.root,
      rootUri: this.root,
      capabilities: {},
      processId: 200,
      workspaceFolders: null,
    });
    return this.lsp.handleDidOpenOrSaveNotification({
      textDocument: {
        uri: this.uri(filename || 'query.graphql'),
        version: 1,
        text:
          this.fileCache.get('query.graphql') ||
          (filename && this.fileCache.get(filename)) ||
          fileText,
      },
    });
  }

  /**
   * Synchronously writes every cached file to disk. Creates parent dirs as needed.
   * Called on construction and after every cache mutation so the on-disk state
   * always matches `fileCache`.
   */
  private writeFiles() {
    for (const [filename, text] of this.fileCache) {
      const dest = this.filePath(filename);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, text);
    }
  }

  public filePath(filename: string) {
    return `${this.root}/${filename}`;
  }

  public uri(filename: string) {
    return URI.file(this.filePath(filename)).toString();
  }

  changeFile(filename: string, text: string) {
    this.fileCache.set(filename, text);
    const dest = this.filePath(filename);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
  }

  async addFile(filename: string, text: string, watched = false) {
    this.changeFile(filename, text);
    if (watched) {
      await this.lsp.handleWatchedFilesChangedNotification({
        changes: [
          {
            uri: this.uri(filename),
            type: FileChangeTypeKind.Created,
          },
        ],
      });
    }
    await this.lsp.handleDidChangeNotification({
      contentChanges: [
        {
          type: FileChangeTypeKind.Created,
          text,
        },
      ],
      textDocument: {
        uri: this.uri(filename),
        version: 2,
      },
    });
  }

  async changeWatchedFile(filename: string, text: string) {
    this.changeFile(filename, text);
    await this.lsp.handleWatchedFilesChangedNotification({
      changes: [
        {
          uri: this.uri(filename),
          type: FileChangeType.Changed,
        },
      ],
    });
  }

  async saveOpenFile(filename: string, text: string) {
    this.changeFile(filename, text);
    await this.lsp.handleDidOpenOrSaveNotification({
      textDocument: {
        uri: this.uri(filename),
        version: 2,
        text,
      },
    });
  }

  async addWatchedFile(filename: string, text: string) {
    this.changeFile(filename, text);
    await this.lsp.handleDidChangeNotification({
      contentChanges: [
        {
          type: FileChangeTypeKind.Created,
          text,
        },
      ],
      textDocument: {
        uri: this.uri(filename),
        version: 2,
      },
    });
  }

  async deleteFile(filename: string) {
    this.fileCache.delete(filename);
    try {
      fs.rmSync(this.filePath(filename), { force: true });
    } catch {
      // ignore — file may already be gone
    }
    await this.lsp.handleWatchedFilesChangedNotification({
      changes: [
        {
          type: FileChangeType.Deleted,
          uri: this.uri(filename),
        },
      ],
    });
  }

  /**
   * Remove this project's tmpdir and forget it. Idempotent.
   * Callers should invoke in afterEach (or equivalent) for every instance.
   */
  public dispose() {
    if (!liveInstances.has(this)) {
      return;
    }
    liveInstances.delete(this);
    fs.rmSync(this.root, { recursive: true, force: true });
  }

  /** Public accessor for the tmpdir path — tests need this to build assertions
   * that reference graphql-config's project key (which derives from rootDir). */
  public get rootDir() {
    return this.root;
  }

  get lsp() {
    return this.messageProcessor;
  }
}
