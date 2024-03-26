import startServer from '../startServer';

describe('startServer', () => {
  it('should start the server', async () => {
    await startServer({});
    // if the server starts, we're good
    expect(true).toBe(true);
  });
});
