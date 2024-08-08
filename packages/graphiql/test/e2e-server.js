/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console, import-x/no-extraneous-dependencies */
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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
  const __dirname = import.meta.dirname;

  const indexHtml = fs.readFileSync(
    path.join(__dirname, '..', 'index.html'),
    'utf8',
  );
  const start = '<!--umd-replace-start-->';
  const end = '<!--umd-replace-end-->';
  const contentToReplace = indexHtml.slice(
    indexHtml.indexOf(start),
    indexHtml.indexOf(end) + end.length,
  );

  const indexHtmlWithUmd = indexHtml.replace(
    contentToReplace,
    /* HTML */ `
      <script
        crossorigin
        src="https://unpkg.com/react@18/umd/react.development.js"
      ></script>
      <script
        crossorigin
        src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"
      ></script>
      <link href="/dist/style.css" rel="stylesheet" />
      <script src="/dist/index.umd.js"></script>
    `,
  );

  app.get('/', (req, res) => {
    res.send(indexHtmlWithUmd);
  });
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
