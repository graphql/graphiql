/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const path = require('path');
const graphqlHTTP = require('express-graphql');
const schema = require('./schema');

const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../resources/webpack.config');

const compiler = Webpack(webpackConfig);

const devServerOptions = {
  ...webpackConfig.devServer,
  ...{
    stats: {
      colors: true,
    },
  },
};

const app = new WebpackDevServer(compiler, devServerOptions);

app.use('/graphql', graphqlHTTP({ schema }));

app.listen(8080, '127.0.0.1', () => {
  console.log('Starting server on http://localhost:8080');
});

app.use(
  '../graphiql.css',
  express.static(path.join(__dirname, '../graphiql.css')),
);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
  '/renderExample.js',
  express.static(path.join(__dirname, '../resources/renderExample.js')),
);

app.listen(process.env.PORT || 0, function() {
  const port = this.address().port;

  console.log('PID', process.pid);
  console.log(`Started on http://localhost:${port}/`);

  process.once('SIGINT', () => {
    process.exit();
  });
  process.once('SIGTERM', () => {
    process.exit();
  });
});
