/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { GraphQLSchema, buildSchema, buildClientSchema } from 'graphql';

import invariant from 'node:assert';
import fs from 'node:fs';
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getOutline,
  Position,
} from 'graphql-language-service';

import path from 'node:path';

import type { CompletionItem, Diagnostic } from 'graphql-language-service';

const GRAPHQL_SUCCESS_CODE = 0;
const GRAPHQL_FAILURE_CODE = 1;

type EXIT_CODE = 0 | 1;

/**
 * Performs GraphQL language service features with provided arguments from
 * the command-line interface.
 *
 * `autocomplete`: returns GraphQL autocomplete suggestions at the cursor
 *                 location provided, or at the end of the query text.
 * `outline`: returns GraphQL query outline information.
 * `validate`: performs GraphQL query lint/validations and returns the results.
 *             Query validation is only performed if a schema path is supplied.
 */

export default function main(
  command: string,
  argv: { [key: string]: string },
): void {
  const filePath = argv.file?.trim();
  invariant(
    argv.text || argv.file,
    'A path to the GraphQL file or its contents is required.',
  );

  const text = ensureText(argv.text, filePath);
  const schemaPath = argv.schemaPath?.trim();

  let exitCode;
  switch (command) {
    case 'autocomplete':
      const lines = text.split('\n');
      const row = parseInt(argv.row, 10) || lines.length - 1;
      const column = parseInt(argv.column, 10) || lines.at(-1).length;
      const point = new Position(row, column);
      exitCode = _getAutocompleteSuggestions(text, point, schemaPath);
      break;
    case 'outline':
      exitCode = _getOutline(text);
      break;
    case 'validate':
      exitCode = _getDiagnostics(filePath, text, schemaPath);
      break;
    default:
      throw new Error(`Unknown command '${command}'`);
  }

  process.exit(exitCode);
}

interface AutocompleteResultsMap {
  [i: number]: CompletionItem;
}

function formatUnknownError(error: unknown) {
  let message: string | undefined;
  if (error instanceof Error) {
    message = error.stack;
  }
  return message ?? String(error);
}

function _getAutocompleteSuggestions(
  queryText: string,
  point: Position,
  schemaPath: string,
): EXIT_CODE {
  invariant(
    schemaPath,
    'A schema path is required to provide GraphQL autocompletion',
  );

  try {
    const schema = schemaPath ? generateSchema(schemaPath) : null;
    const resultArray = schema
      ? getAutocompleteSuggestions(schema, queryText, point)
      : [];
    const resultObject: AutocompleteResultsMap = resultArray.reduce(
      (prev: AutocompleteResultsMap, cur, index) => {
        prev[index] = cur;
        return prev;
      },
      {},
    );
    process.stdout.write(JSON.stringify(resultObject, null, 2));
    return GRAPHQL_SUCCESS_CODE;
  } catch (error) {
    process.stderr.write(formatUnknownError(error) + '\n');
    return GRAPHQL_FAILURE_CODE;
  }
}

interface DiagnosticResultsMap {
  [i: number]: Diagnostic;
}

function _getDiagnostics(
  _filePath: string,
  queryText: string,
  schemaPath?: string,
): EXIT_CODE {
  try {
    // `schema` is not strictly required as GraphQL diagnostics may still notify
    // whether the query text is syntactically valid.
    const schema = schemaPath ? generateSchema(schemaPath) : null;
    const resultArray = getDiagnostics(queryText, schema);
    const resultObject: DiagnosticResultsMap = resultArray.reduce(
      (prev: DiagnosticResultsMap, cur, index) => {
        prev[index] = cur;
        return prev;
      },
      {},
    );
    process.stdout.write(JSON.stringify(resultObject, null, 2));
    return GRAPHQL_SUCCESS_CODE;
  } catch (error) {
    process.stderr.write(formatUnknownError(error) + '\n');
    return GRAPHQL_FAILURE_CODE;
  }
}

function _getOutline(queryText: string): EXIT_CODE {
  try {
    const outline = getOutline(queryText);
    if (outline) {
      process.stdout.write(JSON.stringify(outline, null, 2));
    } else {
      throw new Error('Error parsing or no outline tree found');
    }
  } catch (error) {
    process.stderr.write(formatUnknownError(error) + '\n');
    return GRAPHQL_FAILURE_CODE;
  }
  return GRAPHQL_SUCCESS_CODE;
}

function ensureText(queryText: string, filePath: string): string {
  let text = queryText;
  // Always honor text argument over filePath.
  // If text isn't available, try reading from the filePath.
  if (!text) {
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(String(error));
    }
  }
  return text;
}

function generateSchema(schemaPath: string): GraphQLSchema {
  const schemaDSL = fs.readFileSync(schemaPath, 'utf8');
  const schemaFileExt = path.extname(schemaPath);
  switch (schemaFileExt) {
    case '.graphql':
      return buildSchema(schemaDSL);
    case '.json':
      return buildClientSchema(JSON.parse(schemaDSL));
    default:
      throw new Error('Unsupported schema file extension');
  }
}
