/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */
import express from 'express';
import path from 'path';
import webpackMiddleware from 'webpack-dev-middleware';
import graphqlHTTP from 'express-graphql';
import fs from 'fs'
import schema from './schema';
import Webpack from 'webpack';
import webpackConfig from '../resources/webpack.development.config';

const compiler = Webpack(webpackConfig);


const app = express();
// Server
app.use('/graphql', graphqlHTTP({ schema }));
app.use(webpackMiddleware(compiler, webpackConfig))

console.log('Initial build...');

app.listen(process.env.PORT || 0, function() {
  const port = this.address().port;
  console.log('PID', process.pid)
  fs.writeFile(path.join(__dirname, 'pid'), parseInt(process.pid, 10), () => {
    console.log(`Started on http://localhost:${port}/`);
  }) 
  process.once('SIGINT', () => {
    process.exit()
  })
  process.once('SIGTERM', () => {
    process.exit()
  })
});
