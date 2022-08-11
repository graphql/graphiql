/* eslint-disable react-hooks/rules-of-hooks */
const { useServer } = require('graphql-ws/lib/use/ws');
const { Server: WebSocketServer } = require('ws');
const schema = require('./schema');

module.exports = function afterDevServer(_app, _server, _compiler) {
  const wsServer = new WebSocketServer({
    path: '/subscriptions',
    port: 8081,
  });
  useServer({ schema }, wsServer);
};
