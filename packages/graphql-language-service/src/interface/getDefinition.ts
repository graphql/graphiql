/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  ASTNode,
  FragmentSpreadNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  NamedTypeNode,
  TypeDefinitionNode,
  Location,
} from 'graphql';

import { Definition, FragmentInfo, Uri, ObjectTypeInfo } from '../types';

import { locToRange, offsetToPosition, Range, Position } from '../utils';

export type DefinitionQueryResult = {
  queryRange: Range[];
  definitions: Definition[];
};

export const LANGUAGE = 'GraphQL';

function assert(value: any, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

function getRange(text: string, node: ASTNode): Range {
  const location = node.loc as Location;
  assert(location, 'Expected ASTNode to have a location.');
  return locToRange(text, location) as Range;
}

function getPosition(text: string, node: ASTNode): Position {
  const location = node.loc as Location;
  assert(location, 'Expected ASTNode to have a location.');
  return offsetToPosition(text, location.start);
}

export async function getDefinitionQueryResultForNamedType(
  text: string,
  node: NamedTypeNode,
  dependencies: Array<ObjectTypeInfo>,
): Promise<DefinitionQueryResult> {
  const name = node.name.value;
  const defNodes = dependencies.filter(
    ({ definition }) => definition.name && definition.name.value === name,
  );

  if (defNodes.length === 0) {
    throw Error(`Definition not found for GraphQL type ${name}`);
  }
  const definitions: Array<Definition> = defNodes.map(
    ({ filePath, content, definition }) =>
      getDefinitionForNodeDefinition(filePath || '', content, definition),
  );

  return {
    definitions,
    queryRange: definitions.map(_ => getRange(text, node)),
  };
}

export async function getDefinitionQueryResultForFragmentSpread(
  text: string,
  fragment: FragmentSpreadNode,
  dependencies: Array<FragmentInfo>,
): Promise<DefinitionQueryResult> {
  const name = fragment.name.value;
  const defNodes = dependencies.filter(
    ({ definition }) => definition.name.value === name,
  );

  if (defNodes.length === 0) {
    throw Error(`Definition not found for GraphQL fragment ${name}`);
  }
  const definitions: Array<Definition> = defNodes.map(
    ({ filePath, content, definition }) =>
      getDefinitionForFragmentDefinition(filePath || '', content, definition),
  );

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
    queryRange: definition.name ? [getRange(text, definition.name)] : [],
  };
}

function getDefinitionForFragmentDefinition(
  path: Uri,
  text: string,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
): Definition {
  const name = definition.name;
  if (!name) {
    throw Error('Expected ASTNode to have a Name.');
  }

  return {
    path,
    position: getPosition(text, definition),
    range: getRange(text, definition),
    // TODO: doesnt seem to pick up the inference
    // from assert() exception logic
    name: name.value || '',
    language: LANGUAGE,
    // This is a file inside the project root, good enough for now
    projectRoot: path,
  };
}

function getDefinitionForNodeDefinition(
  path: Uri,
  text: string,
  definition: TypeDefinitionNode,
): Definition {
  const name = definition.name;
  assert(name, 'Expected ASTNode to have a Name.');
  return {
    path,
    position: getPosition(text, definition),
    range: getRange(text, definition),
    name: name.value || '',
    language: LANGUAGE,
    // This is a file inside the project root, good enough for now
    projectRoot: path,
  };
}
