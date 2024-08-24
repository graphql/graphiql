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
const {
  getGraphQLParameters,
  processRequest,
  sendResult,
} = require('graphql-helix'); // update when `graphql-http` is upgraded to support multipart requests for incremental delivery https://github.com/graphql/graphiql/pull/3682#discussion_r1715545279
const WebSocketsServer = require('./afterDevServer');
const { schema, sseSchema } = require('./schema');
const { customExecute } = require('./execute');
// eslint-disable-next-line import-x/no-extraneous-dependencies
const { createHandler } = require('graphql-sse/lib/use/express');

const app = express();

async function handler(req, res) {
  const request = {
    body: req.body,
    headers: req.headers,
    method: req.method,
    query: req.query,
  };

  const { operationName, query, variables } = getGraphQLParameters(request);

  const result = await processRequest({
    operationName,
    query,
    variables,
    request,
    schema,
    execute: customExecute,
  });

  sendResult(result, res);
}

app.use('/graphql/stream', (req, res, next) => {
  // Fixes
  // Access to fetch at 'http://localhost:8080/graphql/stream' from origin 'http://localhost:5173' has been blocked by
  // CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin'
  // header is present on the requested resource. If an opaque response serves your needs, set the request's mode to
  // 'no-cors' to fetch the resource with CORS disabled.

  // CORS headers
  res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST');
  // Set custom headers for CORS
  res.header(
    'Access-Control-Allow-Headers',
    'content-type,x-graphql-event-stream-token',
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Create the GraphQL over SSE handler
const sseHandler = createHandler({ schema, execute: customExecute });
// Serve all methods on `/graphql/stream`
app.use('/graphql/stream', sseHandler);

// Server
app.use(express.json());

app.post('/graphql', handler);
app.get('/graphql', handler);

app.use(express.static(path.resolve(__dirname, '../')));
app.use('index.html', express.static(path.resolve(__dirname, '../dev.html')));

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
