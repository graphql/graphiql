/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type { Uri } from 'graphql-language-service-types';
import type { WatchmanCommandResponse } from '../GraphQLWatchman';

class MockWatchmanClient {
  checkVersion(): Promise<void> {
    return Promise.resolve();
  }

  listFiles(
    entryPath: Uri,
    options?: { [name: string]: any } = {},
  ): Promise<Array<any>> {
    return Promise.resolve([]);
  }

  runCommand(...args: Array<any>): Promise<any> {
    return Promise.resolve();
  }

  watchProject(directoryPath: Uri): Promise<WatchmanCommandResponse> {
    return Promise.resolve({
      version: '',
      relative_path: '',
      watcher: '',
      watch: '',
    });
  }

  subscribe(entryPath: Uri, callback: (result: Object) => void): Promise<void> {
    return Promise.resolve();
  }

  dispose(): void {}
}

export default (MockWatchmanClient: any);
