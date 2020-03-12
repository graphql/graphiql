/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  DocumentNode,
  FragmentDefinitionNode,
  visit,
  SelectionNode,
} from 'graphql';

export function uniqueBy(
  array: readonly SelectionNode[],
  iteratee: (item: any) => any,
) {
  const FilteredMap = new Map();
  const result = [];
  for (const item of array) {
    const uniqeValue = iteratee(item);
    if (!FilteredMap.has(uniqeValue)) {
      FilteredMap.set(uniqeValue, true);
      result.push(item);
    }
  }
  return result;
}

/**
 * Given a document AST, inline all named fragment definitions
 */
export default function mergeAST(documentAST: DocumentNode): DocumentNode {
  const fragmentDefinitions: {
    [key: string]: FragmentDefinitionNode;
  } = Object.create(null);

  for (const definition of documentAST.definitions) {
    if (definition.kind === 'FragmentDefinition') {
      fragmentDefinitions[definition.name.value] = definition;
    }
  }

  return visit(documentAST, {
    FragmentSpread(node) {
      return {
        ...fragmentDefinitions[node.name.value],
        kind: 'InlineFragment',
      };
    },
    SelectionSet(node) {
      return {
        ...node,
        selections: uniqueBy(
          node.selections,
          selection => selection.name.value,
        ),
      };
    },
    FragmentDefinition() {
      return null;
    },
  });
}
