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
  constructor(private _connection: Connection) {}

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
    this._connection.console.log(message);
  }
}

export class NoopLogger implements VSCodeLogger {
  error() {}
  warn() {}
  info() {}
  log() {}
}
