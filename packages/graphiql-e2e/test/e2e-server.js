/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
} from 'graphql-helix'; // update when `graphql-http` is upgraded to support multipart requests for incremental delivery https://github.com/graphql/graphiql/pull/3682#discussion_r1715545279
import * as graphql from 'graphql';

import { createSchema } from './schema.js';
import { createExecute } from './execute.js';

const schema = createSchema(graphql);
const customExecute = createExecute(graphql);

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

// Server
app.use(express.json());

app.post('/graphql', handler);
app.get('/graphql', handler);

const target = process.env.GRAPHIQL_E2E_TARGET;
if (target !== 'source' && target !== 'built') {
  throw new Error(
    'Set GRAPHIQL_E2E_TARGET to either "source" or "built" before starting the E2E server.',
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(
  '/resources',
  express.static(path.join(__dirname, '../../graphiql/resources')),
);

if (target === 'built') {
  app.use(express.static(path.join(__dirname, '../dist')));
} else {
  app.get('/', (req, res) => {
    res.redirect('http://localhost:5173');
  });
}

// messy but it allows close
const server = createServer(app);

server.listen(process.env.PORT || 3100, function () {
  const { port } = this.address();

  console.log(`Started on http://localhost:${port}`);
  console.log('PID', process.pid);

  process.once('SIGINT', () => {
    process.exit();
  });
  process.once('SIGTERM', () => {
    process.exit();
  });
});

const wsServer = new WebSocketServer({ server, path: '/subscriptions' });

// eslint-disable-next-line react-hooks/rules-of-hooks
useServer({ schema }, wsServer);
