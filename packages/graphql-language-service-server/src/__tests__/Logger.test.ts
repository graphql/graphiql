import { Logger } from '../Logger';

describe('Logger', () => {
  const connection = {
    console: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
    },
    onDidChangeConfiguration: vi.fn(),
    workspace: {
      getConfiguration: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default log level, and ignore .log intentionally', () => {
    const logger = new Logger(connection as any);
    expect(logger).toBeDefined();
    expect(logger.logLevel).toBe(0);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(0);
  });

  it('should not change log level when settings are not passed', () => {
    const logger = new Logger(connection as any, true);
    expect(logger).toBeDefined();
    expect(logger.logLevel).toBe(1);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(1);
    expect(logger.logLevel).toBe(1);
    logger.log('test');
    expect(connection.console.log).toHaveBeenCalledTimes(2);
  });
});
