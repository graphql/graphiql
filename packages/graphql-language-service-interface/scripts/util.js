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

import {execFileSync} from 'child_process';
import {
  createReadStream,
  createWriteStream,
} from 'fs';

export function cp(source: string, destination: string): void {
  createReadStream(source).pipe(createWriteStream(destination));
}

export function exec(executable: string, ...args: string[]): void {
  print(execFileSync(executable, args).toString());
}

export function print(string: string): void {
  process.stdout.write(string);
}
