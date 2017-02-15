/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

'use strict';

import {
  createReadStream,
  createWriteStream,
} from 'fs';

export function cp(source: string, destination: string): void {
  createReadStream(source).pipe(createWriteStream(destination));
}
