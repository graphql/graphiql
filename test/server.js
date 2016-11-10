/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

 /* eslint no-console: ["error", { allow: ["log"] }] */
import express from 'express';
import proxy from 'express-http-proxy';
import path from 'path';
import fs from 'fs';

import browserify from 'browserify';
import browserifyShim from 'browserify-shim';
import watchify from 'watchify';
import babelify from 'babelify';

const app = express();
const PORT = 8080;
const bundle = () => b.bundle().pipe(fs.createWriteStream('graphiql.js'));

// Bundle
const b = browserify({
  entries: [ 'src/index.js' ],
  cache: {},
  packageCache: {},
  transform: [ babelify, browserifyShim ],
  plugin: [ watchify ],
  standalone: 'GraphiQL',
  globalTransform: 'browserify-shim'
});

b.on('update', bundle);
b.on('log', msg => console.log(`graphiql.js: ${msg}`));

bundle();

// Server
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));
app.use('/swapi', proxy('http://graphql-swapi.parseapp.com'));
app.listen(PORT, () => console.log(`Started on http://localhost:${PORT}/`));
