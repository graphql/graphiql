/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Logger as VSCodeLogger } from 'vscode-jsonrpc';
import { Connection } from 'vscode-languageserver';

export class Logger implements VSCodeLogger {
  // TODO: allow specifying exact log level?
  // for now this is to handle the debug setting
  private logLevel: number;
  constructor(
    private _connection: Connection,
    debug?: boolean,
  ) {
    this.logLevel = debug ? 1 : 0;
    // first detect the debug flag on initialization
    void (async () => {
      try {
        const config = await this._connection?.workspace?.getConfiguration(
          'vscode-graphql',
        );
        const debugSetting = config?.get('debug');
        if (debugSetting === true) {
          this.logLevel = 1;
        }
        if (debugSetting === false || debugSetting === null) {
          this.logLevel = 0;
        }
      } catch {
        // ignore
      }
    })();
    // then watch for it to change. doesn't require re-creating the logger!
    this._connection?.onDidChangeConfiguration(config => {
      const debugSetting =
        config?.settings && config.settings['vscode-graphql']?.debug;
      // if it's undefined, it's not being passed
      if (debugSetting === undefined) {
        return;
      }
      // if it's true, set it to 1, we will eventually do log levels properly
      if (debugSetting === true) {
        this.logLevel = 1;
      }
      if (debugSetting === false || debugSetting === null) {
        this.logLevel = 0;
      }
    });
  }

  error(message: string): void {
    this._connection.console.error(message);
  }

  warn(message: string): void {
    this._connection.console.warn(message);
  }

  info(message: string): void {
    this._connection.console.info(message);
  }

  log(message: string): void {
    if (this.logLevel > 0) {
      this._connection.console.log(message);
    }
  }
}

export class NoopLogger implements VSCodeLogger {
  error() {}
  warn() {}
  info() {}
  log() {}
}
