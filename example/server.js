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
import graphqlHTTP from 'express-graphql';

import { schema } from './schema';

const app = express();
app.use(express.static(__dirname));
app.use('/graphql', graphqlHTTP(() => ({ schema })));

app.listen(8080, () => console.log('Started on http://localhost:8080/'));
