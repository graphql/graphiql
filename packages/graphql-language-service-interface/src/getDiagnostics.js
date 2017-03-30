/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {GraphQLErrorLocation, GraphQLError} from 'graphql/error';
import type {ASTNode} from 'graphql/language';
import type {GraphQLSchema} from 'graphql/type';
import type {
  Diagnostic,
  CustomValidationRule,
} from 'graphql-language-service-types';

import invariant from 'assert';
import {findDeprecatedUsages, parse} from 'graphql';
import {CharacterStream, onlineParser} from 'graphql-language-service-parser';
import {
  Position,
  Range,
  validateWithCustomRules,
} from 'graphql-language-service-utils';

export const SEVERITY = {
  ERROR: 1,
  WARNING: 2,
  INFORMATION: 3,
  HINT: 4,
};

export function getDiagnostics(
  queryText: string,
  schema: ?GraphQLSchema = null,
  customRules?: Array<CustomValidationRule>,
): Array<Diagnostic> {
  let ast = null;
  try {
    ast = parse(queryText);
  } catch (error) {
    const range = getRange(error.locations[0], queryText);

    return [
      {
        severity: SEVERITY.ERROR,
        message: error.message,
        source: 'GraphQL: Syntax',
        range,
      },
    ];
  }

  // We cannot validate the query unless a schema is provided.
  if (!schema) {
    return [];
  }

  const validationErrorAnnotations = mapCat(
    validateWithCustomRules(schema, ast, customRules),
    error => annotations(error, SEVERITY.ERROR, 'Validation'),
  );
  // Note: findDeprecatedUsages was added in graphql@0.9.0, but we want to
  // support older versions of graphql-js.
  const deprecationWarningAnnotations = !findDeprecatedUsages
    ? []
    : mapCat(findDeprecatedUsages(schema, ast), error =>
        annotations(error, SEVERITY.WARNING, 'Deprecation'));
  return validationErrorAnnotations.concat(deprecationWarningAnnotations);
}

// General utility for map-cating (aka flat-mapping).
function mapCat<T>(
  array: Array<T>,
  mapper: (item: T) => Array<any>,
): Array<any> {
  return Array.prototype.concat.apply([], array.map(mapper));
}

function annotations(
  error: GraphQLError,
  severity: number,
  type: string,
): Array<Diagnostic> {
  if (!error.nodes) {
    return [];
  }
  return error.nodes.map(node => {
    const highlightNode: ASTNode = node.kind !== 'Variable' && node.name
      ? node.name
      : node.variable ? node.variable : node;

    invariant(error.locations, 'GraphQL validation error requires locations.');
    const loc = error.locations[0];
    const end = loc.column + (highlightNode.loc.end - highlightNode.loc.start);
    return {
      source: `GraphQL: ${type}`,
      message: error.message,
      severity,
      range: new Range(
        new Position(loc.line - 1, loc.column - 1),
        new Position(loc.line - 1, end),
      ),
    };
  });
}

function getRange(location: GraphQLErrorLocation, queryText: string) {
  const parser = onlineParser();
  const state = parser.startState();
  const lines = queryText.split('\n');

  invariant(
    lines.length >= location.line,
    'Query text must have more lines than where the error happened',
  );

  let stream = null;

  for (let i = 0; i < location.line; i++) {
    stream = new CharacterStream(lines[i]);
    while (!stream.eol()) {
      const style = parser.token(stream, state);
      if (style === 'invalidchar') {
        break;
      }
    }
  }

  invariant(stream, 'Expected Parser stream to be available.');

  const line = location.line - 1;
  const start = stream.getStartOfToken();
  const end = stream.getCurrentPosition();

  return new Range(new Position(line, start), new Position(line, end));
}
