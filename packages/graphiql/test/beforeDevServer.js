/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const path = require('path');
// const graphqlHTTP = require('express-graphql');
const graphqlHTTP = require('express-graphql-multimode');
const schema = require('./schema');
const mode = { name: 'xml' };

module.exports = function beforeDevServer(app, _server, _compiler) {
  // list of available modes

  const availModes = ['json', 'xml'];

  // endpoint for toggling mode

  app.get('/mode/:mode', (req, res) => {
    const _mode = req.params.mode;
    if (availModes.indexOf(_mode) != -1) {
      mode.name = _mode;
    }
    res.redirect('/');
  });

  // GraphQL Server
  app.post('/graphql', graphqlHTTP({ schema, mode }));

  app.get(
    '/graphql',
    graphqlHTTP({
      schema,
      mode,
    }),
  );

  app.use('/images', express.static(path.join(__dirname, 'images')));

  app.use(
    '/renderExample.js',
    express.static(path.join(__dirname, '../resources/renderExample.js')),
  );
};
