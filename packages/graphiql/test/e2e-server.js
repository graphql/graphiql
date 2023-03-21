/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */
const express = require('express');
const path = require('node:path');
const { graphqlHTTP } = require('express-graphql');
const { GraphQLError } = require('graphql');
const schema = require('./schema');
const app = express();
const { schema: badSchema } = require('./bad-schema');
const WebSocketsServer = require('./afterDevServer');

// Server
app.post('/graphql', graphqlHTTP({ schema }));

app.get(
  '/graphql',
  graphqlHTTP({
    schema,
  }),
);

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

app.use(express.static(path.resolve(__dirname, '../')));

app.listen(process.env.PORT || 0, function () {
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
