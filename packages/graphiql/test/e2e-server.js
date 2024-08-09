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
import { GraphQLError } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';

import { schema } from './schema.js';
import { badSchema } from './bad-schema.js';

const app = express();

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
