/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  GraphQLOutputType,
  GraphQLSchema,
  SelectionNode,
  TypeInfo,
  getNamedType,
  visit,
  visitWithTypeInfo,
} from "graphql";

export function uniqueBy<T>(
  array: readonly SelectionNode[],
  iteratee: (item: FieldNode) => T
) {
  const FilteredMap = new Map<T, FieldNode>();
  const result: SelectionNode[] = [];
  for (const item of array) {
    if (item.kind === "Field") {
      const uniqueValue = iteratee(item);
      const existing = FilteredMap.get(uniqueValue);
      if (item.directives && item.directives.length) {
        // Cannot inline fields with directives (yet)
        result.push(itemClone);
      } else if (existing && existing.selectionSet && item.selectionSet) {
        // Merge the selection sets
        existing.selectionSet.selections = [
          ...existing.selectionSet.selections,
          ...item.selectionSet.selections,
        ];
      } else if (!existing) {
        const itemClone = { ...item };
        FilteredMap.set(uniqueValue, itemClone);
        result.push(itemClone);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

export function inlineRelevantFragmentSpreads(
  fragmentDefinitions: {
    [key: string]: FragmentDefinitionNode | undefined;
  },
  selectionSetType: GraphQLOutputType,
  selections: readonly SelectionNode[]
): readonly SelectionNode[] {
  const selectionSetTypeName = getNamedType(selectionSetType).name;
  const outputSelections = [];
  for (let selection of selections) {
    if (selection.kind === "FragmentSpread") {
      const fragmentDefinition = fragmentDefinitions[selection.name.value];
      if (fragmentDefinition) {
        const { typeCondition, directives, selectionSet } = fragmentDefinition;
        selection = {
          kind: "InlineFragment",
          typeCondition,
          directives,
          selectionSet,
        };
      }
    }
    if (
      selection.kind === "InlineFragment" &&
      // Cannot inline if there are directives
      (!selection.directives || selection.directives?.length === 0)
    ) {
      const fragmentTypeName = selection.typeCondition
        ? selection.typeCondition.name.value
        : null;
      if (!fragmentTypeName || fragmentTypeName === selectionSetTypeName) {
        outputSelections.push(
          ...inlineRelevantFragmentSpreads(
            fragmentDefinitions,
            selectionSetType,
            selection.selectionSet.selections
          )
        );
        continue;
      }
    }
    outputSelections.push(selection);
  }
  return outputSelections;
}

/**
 * Given a document AST, inline all named fragment definitions.
 */
export default function mergeAST(
  documentAST: DocumentNode,
  schema: GraphQLSchema
): DocumentNode {
  const typeInfo = new TypeInfo(schema);
  const fragmentDefinitions: {
    [key: string]: FragmentDefinitionNode | undefined;
  } = Object.create(null);

  for (const definition of documentAST.definitions) {
    if (definition.kind === "FragmentDefinition") {
      fragmentDefinitions[definition.name.value] = definition;
    }
  }

  return visit(
    documentAST,
    visitWithTypeInfo(typeInfo, {
      SelectionSet(node) {
        const selectionSetType = typeInfo.getParentType();
        let { selections } = node;

        if (selectionSetType) {
          selections = inlineRelevantFragmentSpreads(
            fragmentDefinitions,
            selectionSetType,
            selections
          );
        }

        selections = uniqueBy(selections, selection =>
          selection.alias ? selection.alias.value : selection.name.value
        );

        return {
          ...node,
          selections,
        };
      },
      FragmentDefinition() {
        return null;
      },
    })
  );
}
