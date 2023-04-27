/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  ASTNode,
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLError,
  GraphQLSchema,
  Location,
  SourceLocation,
  ValidationRule,
  print,
  validate,
  NoDeprecatedCustomRule,
  parse,
} from 'graphql';

import { CharacterStream, onlineParser } from '../parser';

import { Range, validateWithCustomRules, Position } from '../utils';

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver-types';

import { IRange } from '../types';

// this doesn't work without the 'as', kinda goofy

export const SEVERITY = {
  Error: 'Error',
  Warning: 'Warning',
  Information: 'Information',
  Hint: 'Hint',
} as const;

export type Severity = typeof SEVERITY;

export type SeverityEnum = keyof Severity;

export const DIAGNOSTIC_SEVERITY = {
  [SEVERITY.Error]: 1 as DiagnosticSeverity,
  [SEVERITY.Warning]: 2 as DiagnosticSeverity,
  [SEVERITY.Information]: 3 as DiagnosticSeverity,
  [SEVERITY.Hint]: 4 as DiagnosticSeverity,
};

const invariant = (condition: any, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

export function getDiagnostics(
  query: string,
  schema: GraphQLSchema | null | undefined = null,
  customRules?: Array<ValidationRule>,
  isRelayCompatMode?: boolean,
  externalFragments?: FragmentDefinitionNode[] | string,
): Array<Diagnostic> {
  let ast = null;
  let fragments = '';
  if (externalFragments) {
    fragments =
      typeof externalFragments === 'string'
        ? externalFragments
        : externalFragments.reduce(
            (acc, node) => acc + print(node) + '\n\n',
            '',
          );
  }
  const enhancedQuery = fragments ? `${query}\n\n${fragments}` : query;

  try {
    ast = parse(enhancedQuery);
  } catch (error) {
    if (error instanceof GraphQLError) {
      const range = getRange(
        error.locations?.[0] ?? { line: 0, column: 0 },
        enhancedQuery,
      );

      return [
        {
          severity: DIAGNOSTIC_SEVERITY.Error,
          message: error.message,
          source: 'GraphQL: Syntax',
          range,
        },
      ];
    }
    throw error;
  }

  return validateQuery(ast, schema, customRules, isRelayCompatMode);
}

export function validateQuery(
  ast: DocumentNode,
  schema: GraphQLSchema | null | undefined = null,
  customRules?: Array<ValidationRule> | null,
  isRelayCompatMode?: boolean,
): Array<Diagnostic> {
  // We cannot validate the query unless a schema is provided.
  if (!schema) {
    return [];
  }

  const validationErrorAnnotations = validateWithCustomRules(
    schema,
    ast,
    customRules,
    isRelayCompatMode,
  ).flatMap(error =>
    annotations(error, DIAGNOSTIC_SEVERITY.Error, 'Validation'),
  );

  // TODO: detect if > graphql@15.2.0, and use the new rule for this.
  const deprecationWarningAnnotations = validate(schema, ast, [
    NoDeprecatedCustomRule,
  ]).flatMap(error =>
    annotations(error, DIAGNOSTIC_SEVERITY.Warning, 'Deprecation'),
  );
  return validationErrorAnnotations.concat(deprecationWarningAnnotations);
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
  for (const [i, node] of error.nodes.entries()) {
    const highlightNode =
      node.kind !== 'Variable' && 'name' in node && node.name !== undefined
        ? node.name
        : 'variable' in node && node.variable !== undefined
        ? node.variable
        : node;
    if (highlightNode) {
      invariant(
        error.locations,
        'GraphQL validation error requires locations.',
      );

      // @ts-ignore
      // https://github.com/microsoft/TypeScript/pull/32695
      const loc = error.locations[i];
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
  }
  return highlightedNodes;
}

export function getRange(location: SourceLocation, queryText: string): IRange {
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
