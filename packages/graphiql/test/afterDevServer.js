const { useServer } = require('graphql-ws/lib/use/ws');
const { Server: WebSocketServer } = require('ws');
const schema = require('./schema');

module.exports = function afterDevServer() {
  const wsServer = new WebSocketServer({
    path: '/subscriptions',
    port: 8081,
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useServer({ schema }, wsServer);
};
