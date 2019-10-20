/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Kind } from 'graphql/language/kinds';

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
                selection.name.value === _selection.name.value
            )
      )
      .map(selection => resolveDefinition(fragments, selection));
  }

  return definition;
}

export function mergeAst(queryAst) {
  const fragments = {};
  queryAst.definitions
    .filter(elem => {
      return elem.kind === Kind.FRAGMENT_DEFINITION;
    })
    .forEach(frag => {
      const copyFragment = { ...frag };
      copyFragment.kind = Kind.INLINE_FRAGMENT;
      fragments[frag.name.value] = copyFragment;
    });

  const copyAst = { ...queryAst };
  copyAst.definitions = queryAst.definitions
    .filter(elem => {
      return elem.kind !== Kind.FRAGMENT_DEFINITION;
    })
    .map(op => resolveDefinition(fragments, op));

  return copyAst;
}
