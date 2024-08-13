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
  execute,
  experimentalExecuteIncrementally,
  version,
} = require('graphql');
const schema = require('./schema');
const app = express();
const {
  getGraphQLParameters,
  processRequest,
  sendResult,
} = require('graphql-helix');
const WebSocketsServer = require('./afterDevServer');

const enableExperimentalIncrementalDelivery =
  !version.startsWith('15') && !version.startsWith('16');

const customExecute = enableExperimentalIncrementalDelivery
  ? async (...args) => {
      const result = await experimentalExecuteIncrementally(...args);

      if (!('subsequentResults' in result)) {
        return result;
      }

      const { initialResult, subsequentResults } = result;
      if (typeof subsequentResults[Symbol.asyncIterator] !== 'function') {
        return result;
      }

      return (async function* () {
        yield initialResult;
        yield* subsequentResults;
      })();
    }
  : execute;

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
