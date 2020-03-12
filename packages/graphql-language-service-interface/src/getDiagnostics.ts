/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  ASTNode,
  DocumentNode,
  GraphQLError,
  GraphQLSchema,
  Location,
  SourceLocation,
  ValidationRule,
} from 'graphql';

import invariant from 'assert';
import { findDeprecatedUsages, parse } from 'graphql';

import { CharacterStream, onlineParser } from 'graphql-language-service-parser';

import {
  Range,
  validateWithCustomRules,
  Position,
} from 'graphql-language-service-utils';

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver-types';

export const SEVERITY = {
  ERROR: 1 as DiagnosticSeverity,
  WARNING: 2 as DiagnosticSeverity,
  INFORMATION: 3 as DiagnosticSeverity,
  HINT: 4 as DiagnosticSeverity,
};

export function getDiagnostics(
  query: string,
  schema: GraphQLSchema | null | undefined = null,
  customRules?: Array<ValidationRule>,
  isRelayCompatMode?: boolean,
): Array<Diagnostic> {
  let ast = null;
  try {
    ast = parse(query);
  } catch (error) {
    const range = getRange(error.locations[0], query);
    return [
      {
        severity: SEVERITY.ERROR as DiagnosticSeverity,
        message: error.message,
        source: 'GraphQL: Syntax',
        range,
      },
    ];
  }

  return validateQuery(ast, schema, customRules, isRelayCompatMode);
}

export function validateQuery(
  ast: DocumentNode,
  schema: GraphQLSchema | null | undefined = null,
  customRules?: Array<ValidationRule>,
  isRelayCompatMode?: boolean,
): Array<Diagnostic> {
  // We cannot validate the query unless a schema is provided.
  if (!schema) {
    return [];
  }

  const validationErrorAnnotations = mapCat(
    validateWithCustomRules(schema, ast, customRules, isRelayCompatMode),
    error => annotations(error, SEVERITY.ERROR, 'Validation'),
  );

  // Note: findDeprecatedUsages was added in graphql@0.9.0, but we want to
  // support older versions of graphql-js.
  const deprecationWarningAnnotations = !findDeprecatedUsages
    ? []
    : mapCat(findDeprecatedUsages(schema, ast), error =>
        annotations(error, SEVERITY.WARNING, 'Deprecation'),
      );

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
  severity: DiagnosticSeverity,
  type: string,
): Diagnostic[] {
  if (!error.nodes) {
    return [];
  }
  const highlightedNodes: Diagnostic[] = [];
  error.nodes.forEach(node => {
    const highlightNode =
      node.kind !== 'Variable' && 'name' in node
        ? node.name
        : 'variable' in node
        ? node.variable
        : node;
    if (highlightNode) {
      invariant(
        error.locations,
        'GraphQL validation error requires locations.',
      );

      // @ts-ignore
      // https://github.com/microsoft/TypeScript/pull/32695
      const loc = error.locations[0];
      const highlightLoc = getLocation(highlightNode);
      const end = loc.column + (highlightLoc.end - highlightLoc.start);
      highlightedNodes.push({
        source: `GraphQL: ${type}`,
        message: error.message,
        severity,
        range: new Range(
          new Position(loc.line - 1, loc.column - 1),
          new Position(loc.line - 1, end),
        ),
      });
    }
  });
  return highlightedNodes;
}

export function getRange(location: SourceLocation, queryText: string): Range {
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
  // @ts-ignore
  // https://github.com/microsoft/TypeScript/pull/32695
  const start = stream.getStartOfToken();
  // @ts-ignore
  // https://github.com/microsoft/TypeScript/pull/32695
  const end = stream.getCurrentPosition();
  return new Range(new Position(line, start), new Position(line, end));
}

/**
 * Get location info from a node in a type-safe way.
 *
 * The only way a node could not have a location is if we initialized the parser
 * (and therefore the lexer) with the `noLocation` option, but we always
 * call `parse` without options above.
 */
function getLocation(node: any): Location {
  const typeCastedNode = node as ASTNode;
  const location = typeCastedNode.loc;
  invariant(location, 'Expected ASTNode to have a location.');
  // @ts-ignore
  // https://github.com/microsoft/TypeScript/pull/32695
  return location;
}
