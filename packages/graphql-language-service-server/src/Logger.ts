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
  set level(level: number) {
    this.logLevel = level;
  }
  get level() {
    return this.logLevel;
  }
}

export class NoopLogger implements VSCodeLogger {
  error() {}
  warn() {}
  info() {}
  log() {}
  set level(_level: number) {}
  get level() {
    return 0;
  }
}
