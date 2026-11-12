const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

async function startFixtureServer({ graphqlPath, wsPath }) {
  const { buildSchema, graphql } = require(graphqlPath);
  const { WebSocketServer } = require(wsPath);
  const schema = buildSchema(
    fs.readFileSync(path.join(__dirname, 'fixtures/schema.graphql'), 'utf8'),
  );
  const state = { requests: [], subscriptions: [], cancellations: [] };
  const rootValue = {
    greeting: () => 'hello from the packaged extension',
    user: () => ({ id: 'runtime-user', name: 'Runtime User' }),
  };
  const server = http.createServer(async (request, response) => {
    try {
      if (request.url === '/__state') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(state));
        return;
      }
      const url = new URL(request.url, 'http://127.0.0.1');
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const operation =
        request.method === 'GET'
          ? {
              query: url.searchParams.get('query'),
              variables: JSON.parse(
                url.searchParams.get('variables') || 'null',
              ),
              operationName: url.searchParams.get('operationName'),
            }
          : JSON.parse(body);
      const result = await graphql({
        schema,
        source: operation.query,
        variableValues: operation.variables,
        operationName: operation.operationName,
        rootValue,
      });
      state.requests.push({ ...operation, headers: request.headers, result });
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(result));
    } catch (error) {
      response.statusCode = 500;
      response.end(JSON.stringify({ error: error.message }));
    }
  });
  const sockets = new Set();
  server.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  const websocket = new WebSocketServer({ server });
  websocket.on('connection', socket => {
    socket.on('message', bytes => {
      const message = JSON.parse(bytes.toString());
      if (message.type === 'connection_init') {
        socket.send(JSON.stringify({ type: 'connection_ack' }));
      } else if (message.type === 'subscribe') {
        state.subscriptions.push({ id: message.id, ...message.payload });
        socket.send(
          JSON.stringify({
            id: message.id,
            type: 'next',
            payload: { data: { counter: 1 } },
          }),
        );
      } else if (message.type === 'complete') {
        state.cancellations.push(message.id);
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/graphql`;
  return {
    url,
    controlUrl: url.replace('/graphql', '/__state'),
    state,
    async close() {
      for (const socket of websocket.clients) {
        socket.terminate();
      }
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise(resolve => websocket.close(resolve));
      await new Promise(resolve => server.close(resolve));
    },
  };
}

module.exports = { startFixtureServer };
