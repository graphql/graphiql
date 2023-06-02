/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  DocumentNode,
  GraphQLSchema,
  NamedTypeNode,
  typeFromAST,
} from 'graphql';

/**
 * Provided a schema and a document, produces a `variableToType` Object.
 */
export default function collectVariables(
  schema: GraphQLSchema,
  documentAST: DocumentNode,
) {
  const variableToType = Object.create(null);
  for (const definition of documentAST.definitions) {
    if (definition.kind === 'OperationDefinition') {
      const { variableDefinitions } = definition;
      if (variableDefinitions) {
        for (const { variable, type } of variableDefinitions) {
          const inputType = typeFromAST(schema, type as NamedTypeNode);
          if (inputType) {
            variableToType[variable.name.value] = inputType;
          }
        }
      }
    }
  }
  return variableToType;
}
