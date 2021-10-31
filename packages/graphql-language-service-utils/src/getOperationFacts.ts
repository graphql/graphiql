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

export type OperationFacts = {
  variableToType?: VariableToType;
  operations?: OperationDefinitionNode[];
  documentAST?: DocumentNode;
};

export type QueryFacts = OperationFacts;

/**
 * Provided previous "operationFacts", a GraphQL schema, and a query document
 * string, return a set of facts about that query useful for GraphiQL features.
 *
 * If the query cannot be parsed, returns undefined.
 */
export default function getOperationFacts(
  schema?: GraphQLSchema,
  documentStr?: string | null,
): OperationFacts | undefined {
  if (!documentStr) {
    return;
  }

  let documentAST: DocumentNode;
  try {
    documentAST = parse(documentStr);
  } catch {
    return;
  }

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

  return { variableToType, operations, documentAST };
}

/**
 * for backwards compatibility
 */
export const getQueryFacts = getOperationFacts;
