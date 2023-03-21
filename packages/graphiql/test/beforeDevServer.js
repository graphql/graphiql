/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const path = require('node:path');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema');
const { schema: badSchema } = require('./bad-schema');

module.exports = function beforeDevServer(app, _server, _compiler) {
  // GraphQL Server
  app.post('/graphql', graphqlHTTP({ schema }));
  app.get('/graphql', graphqlHTTP({ schema }));

  app.post('/bad/graphql', (_req, res, next) => {
    res.json({ data: badSchema });
    next();
  });

  app.use('/images', express.static(path.join(__dirname, 'images')));

  app.use(
    '/resources/renderExample.js',
    express.static(path.join(__dirname, '../resources/renderExample.js')),
  );
};
