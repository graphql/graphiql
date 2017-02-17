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
import type {
  Diagnostic,
  CustomValidationRule,
} from 'graphql-language-service-types';

import invariant from 'assert';
import {parse} from 'graphql';

import CharacterStream from '../parser/CharacterStream';
import onlineParser from '../parser/onlineParser';
import {Position, Range} from '../utils/Range';
import {validateWithCustomRules} from '../utils/validateWithCustomRules';

const SEVERITY = {
  ERROR: 1,
  WARNING: 2,
  INFORMATION: 3,
  HINT: 4,
};

export function getDiagnostics(
  queryText: string,
  schema: ?string = null,
  customRules?: Array<CustomValidationRule>,
): Array<Diagnostic> {
  let ast = null;
  try {
    ast = parse(queryText);
  } catch (error) {
    const range = getRange(
      error.locations[0],
      queryText,
    );

    return [{
      severity: SEVERITY.ERROR,
      message: error.message,
      source: 'GraphQL: Syntax',
      range,
    }];
  }

  const errors: Array<GraphQLError> = schema ?
    validateWithCustomRules(schema, ast, customRules) : [];
  return mapCat(errors, error => errorAnnotations(error));
}

// General utility for map-cating (aka flat-mapping).
function mapCat<T>(
  array: Array<T>,
  mapper: (item: T) => Array<any>,
): Array<any> {
  return Array.prototype.concat.apply([], array.map(mapper));
}

function errorAnnotations(
  error: GraphQLError,
): Array<Diagnostic> {
  if (!error.nodes) {
    return [];
  }
  return error.nodes.map(node => {
    const highlightNode: ASTNode =
      node.kind !== 'Variable' && node.name ? node.name :
      node.variable ? node.variable :
      node;

    invariant(error.locations, 'GraphQL validation error requires locations.');
    const loc = error.locations[0];
    const end = loc.column + (highlightNode.loc.end - highlightNode.loc.start);
    return {
      source: 'GraphQL: Validation',
      message: error.message,
      severity: SEVERITY.ERROR,
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

  invariant(
    stream,
    'Expected Parser stream to be available.',
  );

  const line = location.line - 1;
  const start = stream.getStartOfToken();
  const end = stream.getCurrentPosition();

  return new Range(new Position(line, start), new Position(line, end));
}
