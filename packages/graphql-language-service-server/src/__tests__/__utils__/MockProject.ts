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

const defaultMocks = {
  'node_modules/parse-json': mockfs.load('node_modules/parse-json'),
  'node_modules/error-ex': mockfs.load('node_modules/error-ex'),
  'node_modules/is-arrayish': mockfs.load('node_modules/is-arrayish'),
  'node_modules/json-parse-even-better-errors': mockfs.load(
    'node_modules/json-parse-even-better-errors',
  ),
  'node_modules/lines-and-columns': mockfs.load(
    'node_modules/lines-and-columns',
  ),
  'node_modules/@babel/code-frame': mockfs.load(
    'node_modules/@babel/code-frame',
  ),
  'node_modules/@babel/highlight': mockfs.load('node_modules/@babel/highlight'),
  '/tmp/graphql-language-service/test/projects': mockfs.directory({
    mode: 0o777,
  }),
};

export class MockProject {
  private root: string;
  private messageProcessor: MessageProcessor;
  constructor({
    files = [],
    root = '/tmp/test',
    settings,
  }: {
    files: [filename: string, text: string][];
    root?: string;
    settings?: [name: string, vale: any][];
  }) {
    this.root = root;
    const mockFiles = { ...defaultMocks };
    files.map(([filename, text]) => {
      mockFiles[this.filePath(filename)] = text;
    });
    mockfs(mockFiles);
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
  public filePath(filename: string) {
    return `${this.root}/${filename}`;
  }
  public uri(filename: string) {
    return URI.file(this.filePath(filename)).toString();
  }
  changeFile(filename: string, text: string) {
    mockfs({
      [this.filePath(filename)]: text,
    });
  }
  get lsp() {
    return this.messageProcessor;
  }
}
