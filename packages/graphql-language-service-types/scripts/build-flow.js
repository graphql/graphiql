/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

import {
  createReadStream,
  createWriteStream,
  readdirSync,
} from 'fs';
import {join} from 'path';

// Non-recursively copy src/*.js to dist/*.js.flow:
readdirSync('src').forEach(entry => {
  const src = join('src', entry);
  const dest = join('dist', `${entry}.flow`);
  createReadStream(src).pipe(createWriteStream(dest));
});
