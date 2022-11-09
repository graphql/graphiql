/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Logger as VSCodeLogger } from 'vscode-jsonrpc';
import { DiagnosticSeverity } from 'vscode-languageserver';

import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { Socket } from 'net';

import {
  DIAGNOSTIC_SEVERITY,
  SeverityEnum,
  SEVERITY,
} from 'graphql-language-service';

export class Logger implements VSCodeLogger {
  _logFilePath: string;
  _stderrOnly: boolean;

  constructor(tmpDir?: string, stderrOnly?: boolean) {
    const dir = join(tmpDir || os.tmpdir(), 'graphql-language-service-logs');
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

    this._stderrOnly = stderrOnly || false;
  }

  error(message: string): void {
    this._log(message, SEVERITY.Error);
  }

  warn(message: string): void {
    this._log(message, SEVERITY.Warning);
  }

  info(message: string): void {
    this._log(message, SEVERITY.Information);
  }

  log(message: string): void {
    this._log(message, SEVERITY.Hint);
  }

  _log(message: string, severityKey: SeverityEnum): void {
    const timestamp = new Date().toLocaleString(undefined);
    const severity = DIAGNOSTIC_SEVERITY[severityKey];
    const pid = process.pid;

    const stringMessage = String(message).trim();
    const logMessage = `${timestamp} [${severity}] (pid: ${pid}) graphql-language-service-usage-logs: ${stringMessage}\n`;
    // write to the file in tmpdir
    fs.appendFile(this._logFilePath, logMessage, _error => {});
    // @TODO: enable with debugging
    if (severityKey !== SEVERITY.Hint) {
      this._getOutputStream(severity).write(logMessage, err => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      });
    }
  }

  _getOutputStream(severity: DiagnosticSeverity): Socket {
    if (this._stderrOnly || severity === DIAGNOSTIC_SEVERITY.Error) {
      return process.stderr;
    }

    return process.stdout;
  }
}

// function getUnixTime() {
//   return new Date().getTime() / 1000;
// }

function getDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
