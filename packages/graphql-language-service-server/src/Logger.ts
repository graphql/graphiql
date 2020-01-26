/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Logger as VSCodeLogger } from 'vscode-jsonrpc';

import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';

const SEVERITY: { [key: string]: string } = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

export class Logger implements VSCodeLogger {
  _logFilePath: string;
  _stream: fs.WriteStream | null;

  constructor() {
    const dir = join(os.tmpdir(), 'graphql-language-service-logs');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    } catch (_) {
      // intentionally no-op. Don't block the language server even if
      // the necessary setup cannot be completed for logger.
    }

    this._logFilePath = join(
      dir,
      `graphql-language-service-log-${
        os.userInfo().username
      }-${getDateString()}.log`,
    );

    this._stream = null;
  }

  error(message: string): void {
    this._log(message, 'ERROR');
  }

  warn(message: string): void {
    this._log(message, 'WARNING');
  }

  info(message: string): void {
    this._log(message, 'INFO');
  }

  log(message: string): void {
    this._log(message, 'DEBUG');
  }

  _log(message: string, severityKey: string = 'DEBUG'): void {
    const timestamp = new Date().toLocaleString(undefined);
    const severity = SEVERITY[severityKey];
    const pid = process.pid;

    const logMessage = `${timestamp} [${severity}] (pid: ${pid}) graphql-language-service-usage-logs: ${message}\n\n`;
    // write to the file in tmpdir
    fs.appendFile(this._logFilePath, logMessage, _error => {});
  }
}

// function getUnixTime() {
//   return new Date().getTime() / 1000;
// }

function getDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
