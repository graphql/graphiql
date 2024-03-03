import { Logger } from '../Logger';

describe('Logger', () => {
  const connection = {
    console: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
    },
    onDidChangeConfiguration: jest.fn(),
    workspace: {
      getConfiguration: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default log level, and ignore .log intentionally', () => {
    const logger = new Logger(connection as any);
    expect(logger).toBeDefined();
    expect(connection.onDidChangeConfiguration).toHaveBeenCalledTimes(1);
    expect(logger.logLevel).toBe(0);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(0);
  });

  it('should initialize with default log level, then change to logging with new settings, then back when they are disabled', () => {
    const logger = new Logger(connection as any);
    expect(logger).toBeDefined();
    expect(connection.onDidChangeConfiguration).toHaveBeenCalledTimes(1);
    expect(logger.logLevel).toBe(0);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(0);
    connection.onDidChangeConfiguration.mock.calls[0][0]({
      settings: { 'vscode-graphql': { debug: true } },
    });
    expect(logger.logLevel).toBe(1);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(1);
    connection.onDidChangeConfiguration.mock.calls[0][0]({
      settings: { 'vscode-graphql': { debug: false } },
    });
    expect(logger.logLevel).toBe(0);
    logger.log('test');
    // and not a second time
    expect(connection.console.log).toHaveBeenCalledTimes(1);
  });

  it('should not change log level when settings are not passed', () => {
    const logger = new Logger(connection as any, true);
    expect(logger).toBeDefined();
    expect(connection.onDidChangeConfiguration).toHaveBeenCalledTimes(1);
    expect(logger.logLevel).toBe(1);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(1);
    connection.onDidChangeConfiguration.mock.calls[0][0]({});
    expect(logger.logLevel).toBe(1);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(2);
  });

  it('should initialize with debug log level, and .log is visible now', () => {
    const logger = new Logger(connection as any, true);
    expect(logger).toBeDefined();
    expect(connection.onDidChangeConfiguration).toHaveBeenCalledTimes(1);
    expect(logger.logLevel).toBe(1);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(1);
  });
});
