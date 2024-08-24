/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const path = require('node:path');
// eslint-disable-next-line import-x/no-extraneous-dependencies
const { createHandler } = require('graphql-http/lib/use/express');
const schema = require('./schema');
const { customExecute } = require('./execute');

module.exports = function beforeDevServer(app, _server, _compiler) {
  // GraphQL Server
  const handler = createHandler({ schema, execute: customExecute });
  app.post('/graphql', handler);
  app.get('/graphql', handler);

  app.use('/images', express.static(path.join(__dirname, 'images')));

  app.use(
    '/resources/renderExample.js',
    express.static(path.join(__dirname, '../resources/renderExample.js')),
  );
};
