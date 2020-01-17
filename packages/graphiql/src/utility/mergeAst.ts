import { DocumentNode, FragmentDefinitionNode, visit } from 'graphql';

export function uniqueBy(array: any[], iteratee: (item: any) => any) {
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
export function mergeAST(documentAST: DocumentNode): DocumentNode {
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
