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
const { GraphQLError } = require('graphql');
const schema = require('./schema');
const app = express();
const { schema: badSchema } = require('./bad-schema');
const WebSocketsServer = require('./afterDevServer');

// Server
app.post('/graphql', createHandler({ schema }));
app.get('/graphql', createHandler({ schema }));

app.post('/bad/graphql', (_req, res, next) => {
  res.json({ data: badSchema });
  next();
});

app.post('/http-error/graphql', (_req, res, next) => {
  res.status(502).send('Bad Gateway');
  next();
});

app.post('/graphql-error/graphql', (_req, res, next) => {
  res.json({ errors: [new GraphQLError('Something unexpected happened...')] });
  next();
});

const IS_DEV = process.env.npm_lifecycle_script.endsWith(' vite');

if (IS_DEV) {
  app.get('/', (req, res) => {
    res.redirect('http://localhost:5173');
  });
} else {
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../resources/dev.html'));
  });
  app.use(express.static(path.resolve(__dirname, '../')));
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
