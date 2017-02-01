/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {
  FragmentSpreadNode,
  FragmentDefinitionNode,
} from 'graphql/language';
import type {
  Definition,
  DefinitionQueryResult,
  FragmentInfo,
  Uri,
} from '../types/Types';

import {offsetToPosition, locToRange} from '../utils/Range';

export const LANGUAGE = 'GraphQL';

export async function getDefinitionQueryResultForFragmentSpread(
  text: string,
  fragment: FragmentSpreadNode,
  dependencies: Array<FragmentInfo>,
): Promise<DefinitionQueryResult> {
  const name = fragment.name.value;
  const defNodes = dependencies.filter(
    ({definition}) => definition.name.value === name,
  );
  if (defNodes === []) {
    process.stderr.write(`Definition not found for GraphQL fragment ${name}`);
    return {queryRange: [], definitions: []};
  }
  const definitions: Array<Definition> = defNodes.map(
    ({filePath, content, definition}) =>
      getDefinitionForFragmentDefinition(filePath || '', content, definition),
  );
  return {
    definitions,
    queryRange: definitions.map(_ => locToRange(text, fragment.loc)),
  };
}

export function getDefinitionQueryResultForDefinitionNode(
  path: Uri,
  text: string,
  definition: FragmentDefinitionNode,
): DefinitionQueryResult {
  return {
    definitions: [getDefinitionForFragmentDefinition(path, text, definition)],
    queryRange: [locToRange(text, definition.name.loc)],
  };
}

function getDefinitionForFragmentDefinition(
  path: Uri,
  text: string,
  definition: FragmentDefinitionNode,
): Definition {
  return {
    path,
    position: offsetToPosition(text, definition.name.loc.start),
    range: locToRange(text, definition.loc),
    name: definition.name.value,
    language: LANGUAGE,
    // This is a file inside the project root, good enough for now
    projectRoot: path,
  };
}
