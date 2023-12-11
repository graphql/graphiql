/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const path = require('node:path');
const { createHandler } = require('graphql-http/lib/use/express');
const schema = require('./schema');
const { schema: badSchema } = require('./bad-schema');
const { readdirSync } = require('node:fs');

module.exports = function beforeDevServer(app, _server, _compiler) {
  // GraphQL Server
  app.post('/graphql', createHandler({ schema }));
  app.get('/graphql', createHandler({ schema }));

  app.post('/bad/graphql', (_req, res, next) => {
    res.json({ data: badSchema });
    next();
  });

  app.use('/images', express.static(path.join(__dirname, 'images')));

  app.use(
    '/resources/renderExample.js',
    express.static(path.join(__dirname, '../resources/renderExample.js')),
  );

  readdirSync(path.join(__dirname, '../../'))
    .filter(name => {
      return name.startsWith('graphiql-plugin-');
    })
    .forEach(name => {
      console.log({ name });
      app.use(
        `/plugins/${name}.js`,
        express.static(path.join(__dirname, `../../${name}/dist/index.umd.js`)),
      );
      app.use(
        `/plugins/${name}.css`,
        express.static(path.join(__dirname, `../../${name}/dist/style.css`)),
      );
    });
};
