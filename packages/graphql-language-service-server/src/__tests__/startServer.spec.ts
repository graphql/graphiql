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
  it('should start the server', async () => {
    c = await startServer();
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  // TODO: this one fails to exit properly in tests
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should start the server with stream', async () => {
    c = await startServer({
      method: 'stream',
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  it('should start the server with ipc', async () => {
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
