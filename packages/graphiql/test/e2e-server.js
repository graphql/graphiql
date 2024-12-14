/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */
const { createServer } = require('node:http');
const express = require('express');
const path = require('node:path');
const { createHandler } = require('graphql-http/lib/use/express');
const WebSocketsServer = require('./afterDevServer');
const { schema } = require('./schema');
const { customExecute } = require('./execute');

const app = express();

const handler = createHandler({ schema, execute: customExecute });

// Server
app.use(express.json());

app.post('/graphql', handler);
app.get('/graphql', handler);

// On CI we test the UMD build
if (process.env.CI === 'true') {
  app.use(express.static(path.join(__dirname, '..')));
} else {
  app.get('/', (req, res) => {
    res.redirect('http://localhost:5173');
  });
}

// messy but it allows close
const server = createServer(app);

server.listen(process.env.PORT || 3100, function () {
  const { port } = this.address();

  console.log(`Started on http://localhost:${port}/`);
  console.log('PID', process.pid);

  process.once('SIGINT', () => {
    process.exit();
  });
  process.once('SIGTERM', () => {
    process.exit();
  });
});

WebSocketsServer();
