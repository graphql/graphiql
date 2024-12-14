import mockfs from 'mock-fs';
import { MessageProcessor } from '../../MessageProcessor';
import { Logger as VSCodeLogger } from 'vscode-jsonrpc';
import { URI } from 'vscode-uri';
import { FileChangeType } from 'vscode-languageserver';
import { FileChangeTypeKind } from 'graphql-language-service';

export type MockFile = [filename: string, text: string];

export class MockLogger implements VSCodeLogger {
  error = vi.fn();
  warn = vi.fn();
  info = vi.fn();
  log = vi.fn();
}

// when using mockfs with cosmic-config, a dynamic inline
// require of parse-json creates the necessity for loading in the actual
// modules to the mocked filesystem
const modules = [
  'parse-json',
  'error-ex',
  'is-arrayish',
  'json-parse-even-better-errors',
  'lines-and-columns',
  '@babel/code-frame',
  '@babel/highlight',
  // these I think are just required by jest when you console log from a test
  'pretty-format',
  'ansi-regex',
  'js-tokens',
  'escape-string-regexp',
  'jest-worker',
  'jiti',
  'cosmiconfig',
  'minimatch',
  'tslib',
];
const defaultMocks = modules.reduce((acc, module) => {
  acc[`node_modules/${module}`] = mockfs.load(`../../node_modules/${module}`);
  return acc;
}, {});

type File = [filename: string, text: string];
type Files = File[];

export class MockProject {
  private root: string;
  private fileCache: Map<string, string>;
  private messageProcessor: MessageProcessor;
  constructor({
    files = [],
    root = '/tmp/test',
    settings,
  }: {
    files: Files;
    root?: string;
    settings?: Record<string, any>;
  }) {
    this.root = root;
    this.fileCache = new Map(files);

    this.mockFiles();
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
        rootDir: root,
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
  private mockFiles() {
    const mockFiles = {
      ...defaultMocks,
      // without this, the generated schema file may not be cleaned up by previous tests
      '/tmp/graphql-language-service': mockfs.directory(),
    };
    for (const [filename, text] of this.fileCache) {
      mockFiles[this.filePath(filename)] = text;
    }
    mockfs(mockFiles);
  }
  public filePath(filename: string) {
    return `${this.root}/${filename}`;
  }
  public uri(filename: string) {
    return URI.file(this.filePath(filename)).toString();
  }
  changeFile(filename: string, text: string) {
    this.fileCache.set(filename, text);
    this.mockFiles();
  }
  async addFile(filename: string, text: string, watched = false) {
    this.fileCache.set(filename, text);
    this.mockFiles();
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
    mockfs.restore();
    this.fileCache.delete(filename);
    this.mockFiles();
    await this.lsp.handleWatchedFilesChangedNotification({
      changes: [
        {
          type: FileChangeType.Deleted,
          uri: this.uri(filename),
        },
      ],
    });
  }
  get lsp() {
    return this.messageProcessor;
  }
}
