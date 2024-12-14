import startServer from '../startServer';

describe('startServer', () => {
  let c;
  afterEach(async () => {
    if (c) {
      try {
        await c.sendNotification('exit');
      } catch {}
    }
  });
  // eslint-disable-next-line  @vitest/no-disabled-tests -- TODO: Blocked by https://github.com/vitest-dev/vitest/issues/7082
  it.skip('should start the server', async () => {
    c = await startServer();
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  // eslint-disable-next-line  @vitest/no-disabled-tests -- TODO: this one fails to exit properly in tests
  it.skip('should start the server with stream', async () => {
    c = await startServer({
      method: 'stream',
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  // eslint-disable-next-line  @vitest/no-disabled-tests -- TODO: Blocked by https://github.com/vitest-dev/vitest/issues/7082
  it.skip('should start the server with ipc', async () => {
    c = await startServer({
      method: 'node',
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  it('should start the server with websockets', async () => {
    c = await startServer({
      method: 'socket',
      port: 4000,
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
});
