/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console, import-x/no-extraneous-dependencies */
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import {
  execute,
  experimentalExecuteIncrementally,
  version,
} from 'graphql';
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
} from 'graphql-helix'; // update when `graphql-http` is upgraded to support multipart requests for incremental delivery https://github.com/graphql/graphiql/pull/3682#discussion_r1715545279

import { schema } from './schema.js';


const app = express();

const customExecute =
  parseInt(version, 10) > 16
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

// On CI we test the UMD build
if (process.env.CI === 'true') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // const __dirname = import.meta.dirname; // can be converted to, after Node.js upgrade to v20
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

  console.log(`Started on http://localhost:${port}`);
  console.log('PID', process.pid);

  process.once('SIGINT', () => {
    process.exit();
  });
  process.once('SIGTERM', () => {
    process.exit();
  });
});

const wsServer = new WebSocketServer({
  path: '/subscriptions',
  port: 8081,
});

// eslint-disable-next-line react-hooks/rules-of-hooks
useServer({ schema }, wsServer);
