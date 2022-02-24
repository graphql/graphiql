/* eslint-disable no-redeclare */
/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { parse, visit } from 'graphql';
import { collectVariables } from './collectVariables';

import type { VariableToType } from './collectVariables';
import type {
  GraphQLSchema,
  DocumentNode,
  OperationDefinitionNode,
} from 'graphql';

export type OperationASTFacts = {
  variableToType?: VariableToType;
  operations: OperationDefinitionNode[];
};

/**
 * extract all operation nodes, and if schema is present, variable definitions, in a map
 *
 * @param documentAST {DocumentNode} a graphql-js compatible AST node
 * @param schema {GraphQLSchema} optional schema
 * @returns {OperationASTFacts}
 * @example
 *
 * ```ts
 *  const { variablesToType, operations } = getOperationASTFacts(
 *    parse('documentString'),
 *  );
 *  operations.forEach(op => {
 *    console.log(op.name, op.operation, op.loc);
 *  });
 *   Object.entries(variablesToType).forEach(([variableName, type]) => {
 *    console.log(variableName, type);
 *  });
 * ```
 */

export function getOperationASTFacts(
  documentAST: DocumentNode,
  schema?: GraphQLSchema | null,
): OperationASTFacts {
  const variableToType = schema
    ? collectVariables(schema, documentAST)
    : undefined;

  // Collect operations by their names.
  const operations: OperationDefinitionNode[] = [];

  visit(documentAST, {
    OperationDefinition(node) {
      operations.push(node);
    },
  });

  return { variableToType, operations };
}

export type OperationFacts = {
  documentAST: DocumentNode;
} & OperationASTFacts;

export type QueryFacts = OperationFacts;

/**
 * Provided previous "queryFacts", a GraphQL schema, and a query document
 * string, return a set of facts about that query useful for GraphiQL features.
 *
 * If the query cannot be parsed, returns undefined.
 * @param schema {GraphQLSchema} (optional)
 * @param documentString {string} the document you want to parse for operations (optional)
 *
 * @returns {OperationFacts | undefined}
 */
export default function getOperationFacts(
  schema?: GraphQLSchema | null,
  documentString?: string | null,
): OperationFacts | undefined {
  if (!documentString) {
    return;
  }

  try {
    const documentAST = parse(documentString);
    return {
      ...getOperationASTFacts(documentAST, schema),
      documentAST,
    };
  } catch {
    return;
  }
}

/**
 * for backwards compatibility
 */
export const getQueryFacts = getOperationFacts;
