import startServer from '../startServer';

describe('startServer', () => {
  it('should start the server', async () => {
    await startServer();
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  // this one fails to exit
  it('should start the server with stream', async () => {
    await startServer({
      method: 'stream',
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  it('should start the server with ipc', async () => {
    await startServer({
      method: 'node',
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
  it('should start the server with websockets', async () => {
    await startServer({
      method: 'socket',
      port: 4000,
    });
    // if the server starts, we're good
    expect(true).toBe(true);
  });
});
