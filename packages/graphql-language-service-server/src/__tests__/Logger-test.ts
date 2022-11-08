/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { tmpdir } from 'os';
import { Logger } from '../Logger';

describe('Logger', () => {
  let mockedStdoutWrite: jest.SpyInstance = null;
  let mockedStderrWrite: jest.SpyInstance = null;

  beforeEach(() => {
    mockedStdoutWrite = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    mockedStderrWrite = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    mockedStdoutWrite.mockReset();
    mockedStderrWrite.mockReset();
  });

  it('logs to stdout', () => {
    const logger = new Logger(tmpdir());
    logger.info('log test');

    expect(mockedStdoutWrite.mock.calls.length).toBe(1);
    expect(mockedStdoutWrite.mock.calls[0][0]).toContain('log test');
    expect(mockedStderrWrite.mock.calls.length).toBe(0);
  });

  it('logs to stderr', () => {
    const logger = new Logger(tmpdir());
    logger.error('error test');

    expect(mockedStdoutWrite.mock.calls.length).toBe(0);
    expect(mockedStderrWrite.mock.calls.length).toBe(1);
    expect(mockedStderrWrite.mock.calls[0][0]).toContain('error test');
  });

  it('only writes to stderr with "stderrOnly" enabled', () => {
    const stderrOnly = true;
    const logger = new Logger(tmpdir(), stderrOnly);
    logger.info('info test');
    logger.warn('warn test');
    // log is only logged to file now :)
    logger.log('log test');
    logger.error('error test');

    expect(mockedStdoutWrite.mock.calls.length).toBe(0);
    expect(mockedStderrWrite.mock.calls.length).toBe(3);
    expect(mockedStderrWrite.mock.calls[0][0]).toContain('info test');
    expect(mockedStderrWrite.mock.calls[1][0]).toContain('warn test');
    expect(mockedStderrWrite.mock.calls[2][0]).toContain('error test');
  });
});
