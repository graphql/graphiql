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
  ASTNode,
  FragmentSpreadNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
} from 'graphql';
import type {
  Definition,
  DefinitionQueryResult,
  FragmentInfo,
  Range,
  Uri,
} from 'graphql-language-service-types';
import {locToRange, offsetToPosition} from 'graphql-language-service-utils';
import invariant from 'assert';

export const LANGUAGE = 'GraphQL';

function getRange(text: string, node: ASTNode): Range {
  const location = node.loc;
  invariant(location, 'Expected ASTNode to have a location.');
  return locToRange(text, location);
}

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
  const definitions: Array<Definition> = defNodes.map(({
    filePath,
    content,
    definition,
  }) =>
    getDefinitionForFragmentDefinition(filePath || '', content, definition));
  return {
    definitions,
    queryRange: definitions.map(_ => getRange(text, fragment)),
  };
}

export function getDefinitionQueryResultForDefinitionNode(
  path: Uri,
  text: string,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
): DefinitionQueryResult {
  return {
    definitions: [getDefinitionForFragmentDefinition(path, text, definition)],
    queryRange: [getRange(text, definition.name)],
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
    range: getRange(text, definition),
    name: definition.name.value,
    language: LANGUAGE,
    // This is a file inside the project root, good enough for now
    projectRoot: path,
  };
}
