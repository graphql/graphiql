import mockfs from 'mock-fs';
import { MessageProcessor } from '../../MessageProcessor';
import { Logger as VSCodeLogger } from 'vscode-jsonrpc';
import { URI } from 'vscode-uri';

export class MockLogger implements VSCodeLogger {
  error = jest.fn();
  warn = jest.fn();
  info = jest.fn();
  log = jest.fn();
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
  // these i think are just required by jest when you console log from a test
  'jest-message-util',
  'stack-utils',
  'pretty-format',
  'ansi-regex',
  'js-tokens',
  'escape-string-regexp',
];
const defaultMocks = modules.reduce((acc, module) => {
  acc[`node_modules/${module}`] = mockfs.load(`node_modules/${module}`);
  return acc;
}, {});

type Files = [filename: string, text: string][];

export class MockProject {
  private root: string;
  private files: Files;
  private messageProcessor: MessageProcessor;
  constructor({
    files = [],
    root = '/tmp/test',
    settings,
  }: {
    files: Files;
    root?: string;
    settings?: [name: string, vale: any][];
  }) {
    this.root = root;
    this.files = files;

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
      loadConfigOptions: { rootDir: root },
    });
  }
  private mockFiles() {
    const mockFiles = { ...defaultMocks };
    this.files.map(([filename, text]) => {
      mockFiles[this.filePath(filename)] = text;
    });
    mockfs(mockFiles);
  }
  public filePath(filename: string) {
    return `${this.root}/${filename}`;
  }
  public uri(filename: string) {
    return URI.file(this.filePath(filename)).toString();
  }
  changeFile(filename: string, text: string) {
    this.files.push([filename, text]);
    this.mockFiles();
  }
  get lsp() {
    return this.messageProcessor;
  }
}
