/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import { parse, typeFromAST } from 'graphql';


/**
 * Provided previous "queryFacts", a GraphQL schema, and a query document
 * string, return a set of facts about that query useful for GraphiQL features.
 *
 * If the query cannot be parsed, returns undefined.
 */
export default function getQueryFacts(prevFacts, schema, documentStr) {
  if (!documentStr) {
    return;
  }

  let documentAST;
  try {
    documentAST = parse(documentStr);
  } catch (e) {
    return;
  }

  const variableToType = schema ? collectVariables(schema, documentAST) : null;

  // Collect operations by their names.
  const operations = [];
  documentAST.definitions.forEach(def => {
    if (def.kind === 'OperationDefinition') {
      operations.push(def);
    }
  });

  // Determine what the selected operation should be.
  const selectedOperation = getSelectedOperation(prevFacts, operations);

  return { variableToType, operations, selectedOperation };
}

/**
 * Provided previous "queryFacts" and a list of operations, determine what the
 * next selected operation should be.
 */
export function getSelectedOperation(prevFacts, operations) {
  // If there are not enough operations to bother with, return nothing.
  if (!operations || operations.length < 1) {
    return;
  }

  // If a previous selection still exists, continue to use it.
  const names = operations.map(op => op.name && op.name.value);
  const prevSelectedOperation = prevFacts.selectedOperation;
  if (prevSelectedOperation && names.indexOf(prevSelectedOperation) !== -1) {
    return prevSelectedOperation;
  }

  // If a previous selection was the Nth operation, use the same Nth.
  if (prevSelectedOperation && prevFacts.operations) {
    const prevNames = prevFacts.operations.map(op => op.name && op.name.value);
    const prevIndex = prevNames.indexOf(prevSelectedOperation);
    if (prevIndex && prevIndex < names.length) {
      return names[prevIndex];
    }
  }

  // Use the first operation.
  return names[0];
}

/**
 * Provided a schema and a document, produces a `variableToType` Object.
 */
export function collectVariables(schema, documentAST) {
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
