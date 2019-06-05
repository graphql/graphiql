/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Kind } from 'graphql/language/kinds';
import {
  FragmentDefinitionNode,
  Location,
  DocumentNode,
  DefinitionNode,
  NameNode,
  VariableDefinitionNode,
  NamedTypeNode,
  DirectiveNode,
  SelectionSetNode,
} from 'graphql';

interface MutableDocumentNode extends DocumentNode {
  definitions: ReadonlyArray<DefinitionNode>;
}

interface MutableFragmentDefinitionNode {
  kind: 'FragmentDefinition' | 'InlineFragment';
  readonly loc?: Location;
  readonly name: NameNode;
  // Note: fragment variable definitions are experimental and may be changed
  // or removed in the future.
  readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
  readonly typeCondition: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
}

function resolveDefinition(fragments, obj) {
  let definition = obj;
  if (definition.kind === Kind.FRAGMENT_SPREAD) {
    definition = fragments[definition.name.value];
  }

  if (definition.selectionSet) {
    definition.selectionSet.selections = definition.selectionSet.selections
      .filter(
        (selection, idx, self) =>
          selection.kind !== Kind.FRAGMENT_SPREAD ||
          idx ===
            self.findIndex(
              _selection =>
                _selection.kind === Kind.FRAGMENT_SPREAD &&
                selection.name.value === _selection.name.value,
            ),
      )
      .map(selection => resolveDefinition(fragments, selection));
  }

  return definition;
}

export function mergeAst(queryAst: MutableDocumentNode) {
  const fragments: { [key: string]: MutableFragmentDefinitionNode } = {};
  queryAst.definitions
    .filter(elem => {
      return elem.kind === Kind.FRAGMENT_DEFINITION;
    })
    .forEach((frag: MutableFragmentDefinitionNode) => {
      const copyFragment = Object.assign({}, frag);
      copyFragment.kind = Kind.INLINE_FRAGMENT;
      fragments[frag.name.value] = copyFragment;
    });

  const copyAst = Object.assign({}, queryAst);
  copyAst.definitions = queryAst.definitions
    .filter(elem => {
      return elem.kind !== Kind.FRAGMENT_DEFINITION;
    })
    .map(op => resolveDefinition(fragments, op));

  return copyAst;
}
