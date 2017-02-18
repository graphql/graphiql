/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {Uri} from 'graphql-language-service-types';

import fs from 'fs';
import path from 'path';

import {GRAPHQL_CONFIG_NAME} from './GraphQLConfig';

/**
 * Finds a .graphqlrc configuration file, and returns null if not found.
 * If the file isn't present in the provided directory path, walk up the
 * directory tree until the file is found or it reaches the root directory.
 */
export function findGraphQLConfigDir(dirPath: Uri): ?string {
  let currentPath = path.resolve(dirPath);
  while (true) {
    const filePath = path.join(currentPath, GRAPHQL_CONFIG_NAME);
    if (fs.existsSync(filePath)) {
      break;
    }
    if (isRootDir(currentPath)) {
      break;
    }
    currentPath = path.dirname(currentPath);
  }

  return !isRootDir(currentPath) ? currentPath : null;
}

function isRootDir(dirPath: Uri): boolean {
  return path.dirname(dirPath) === dirPath;
}
