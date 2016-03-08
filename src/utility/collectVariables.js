/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import { typeFromAST } from 'graphql';


/**
 * Provided a schema and a document, produces a `variableToType` Object.
 */
export default function collectVariables(schema, documentAST) {
  const variableToType = Object.create(null);
  documentAST.definitions.forEach(definition => {
    if (definition.kind === 'OperationDefinition') {
      const variableDefinitions = definition.variableDefinitions;
      if (variableDefinitions) {
        variableDefinitions.forEach(({ variable, type }) => {
          const inputType = typeFromAST(schema, type);
          if (inputType) {
            variableToType[variable.name.value] = inputType;
          }
        });
      }
    }
  });
  return variableToType;
}
