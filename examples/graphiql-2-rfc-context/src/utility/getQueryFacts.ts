/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  parse,
  typeFromAST,
  GraphQLSchema,
  DocumentNode,
  OperationDefinitionNode,
  NamedTypeNode,
  GraphQLNamedType,
  Kind,
} from 'graphql';

export type VariableToType = {
  [variable: string]: GraphQLNamedType;
};

export type QueryFacts = {
  variableToType?: VariableToType;
  operations?: OperationDefinitionNode[];
};

/**
 * Provided previous "queryFacts", a GraphQL schema, and a query document
 * string, return a set of facts about that query useful for GraphiQL features.
 *
 * If the query cannot be parsed, returns undefined.
 */
export default function getOperationFacts(
  schema?: GraphQLSchema,
  documentStr?: string | null,
): QueryFacts | undefined {
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
  documentAST.definitions.forEach(def => {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      operations.push(def);
    }
  });

  return { variableToType, operations };
}

/**
 * Provided a schema and a document, produces a `variableToType` Object.
 */
export function collectVariables(
  schema: GraphQLSchema,
  documentAST: DocumentNode,
): VariableToType {
  const variableToType: {
    [variable: string]: GraphQLNamedType;
  } = Object.create(null);
  documentAST.definitions.forEach(definition => {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      const variableDefinitions = definition.variableDefinitions;
      if (variableDefinitions) {
        variableDefinitions.forEach(({ variable, type }) => {
          const inputType = typeFromAST(schema, type as NamedTypeNode);
          if (inputType) {
            variableToType[variable.name.value] = inputType;
          }
        });
      }
    }
  });
  return variableToType;
}
