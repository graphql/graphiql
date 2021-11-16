/**
 *  Copyright (c) 2021 GraphQL Contributors.
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
  ASTVisitor,
  Kind,
} from 'graphql';

type Maybe<T> = null | T;

export function uniqueBy<T>(
  array: readonly SelectionNode[],
  iteratee: (item: FieldNode) => T,
) {
  const FilteredMap = new Map<T, FieldNode>();
  const result: SelectionNode[] = [];
  for (const item of array) {
    if (item.kind === 'Field') {
      const uniqueValue = iteratee(item);
      const existing = FilteredMap.get(uniqueValue);
      if (item.directives && item.directives.length) {
        // Cannot inline fields with directives (yet)
        const itemClone = { ...item };
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
  selections: readonly SelectionNode[],
  selectionSetType?: Maybe<GraphQLOutputType>,
): readonly SelectionNode[] {
  const selectionSetTypeName = selectionSetType
    ? getNamedType(selectionSetType).name
    : null;
  const outputSelections = [];
  const seenSpreads = [];
  for (let selection of selections) {
    if (selection.kind === 'FragmentSpread') {
      const fragmentName = selection.name.value;
      if (!selection.directives || selection.directives.length === 0) {
        if (seenSpreads.indexOf(fragmentName) >= 0) {
          /* It's a duplicate - skip it! */
          continue;
        } else {
          seenSpreads.push(fragmentName);
        }
      }
      const fragmentDefinition = fragmentDefinitions[selection.name.value];
      if (fragmentDefinition) {
        const { typeCondition, directives, selectionSet } = fragmentDefinition;
        selection = {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition,
          directives,
          selectionSet,
        };
      }
    }
    if (
      selection.kind === Kind.INLINE_FRAGMENT &&
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
            selection.selectionSet.selections,
            selectionSetType,
          ),
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
  schema?: GraphQLSchema | null,
): DocumentNode {
  // If we're given the schema, we can simplify even further by resolving object
  // types vs unions/interfaces
  const typeInfo = schema ? new TypeInfo(schema) : null;

  const fragmentDefinitions: {
    [key: string]: FragmentDefinitionNode | undefined;
  } = Object.create(null);

  for (const definition of documentAST.definitions) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragmentDefinitions[definition.name.value] = definition;
    }
  }

  const visitors: ASTVisitor = {
    SelectionSet(node: any) {
      const selectionSetType = typeInfo ? typeInfo.getParentType() : null;
      let { selections } = node;

      selections = inlineRelevantFragmentSpreads(
        fragmentDefinitions,
        selections,
        selectionSetType,
      );

      selections = uniqueBy(selections, selection =>
        selection.alias ? selection.alias.value : selection.name.value,
      );

      return {
        ...node,
        selections,
      };
    },
    FragmentDefinition() {
      return null;
    },
  };

  return visit(
    documentAST,
    typeInfo ? visitWithTypeInfo(typeInfo, visitors) : visitors,
  );
}
