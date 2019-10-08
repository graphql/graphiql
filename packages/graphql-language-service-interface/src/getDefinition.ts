/**
 *  Copyright (c) 2019 GraphQL Contributors
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

import {
  Definition,
  DefinitionQueryResult,
  FragmentInfo,
  Position,
  Range,
  Uri,
  ObjectTypeInfo,
} from 'graphql-language-service-types';

import { locToRange, offsetToPosition } from 'graphql-language-service-utils';
import invariant from 'assert';

export const LANGUAGE = 'GraphQL';

function getRange(text: string, node: ASTNode): Range {
  const location = node.loc as Location;
  invariant(location, 'Expected ASTNode to have a location.');
  return locToRange(text, location);
}

function getPosition(text: string, node: ASTNode): Position {
  const location = node.loc as Location;
  invariant(location, 'Expected ASTNode to have a location.');
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
    process.stderr.write(`Definition not found for GraphQL type ${name}`);
    return { queryRange: [], definitions: [] };
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
    process.stderr.write(`Definition not found for GraphQL fragment ${name}`);
    return { queryRange: [], definitions: [] };
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
  invariant(name, 'Expected ASTNode to have a Name.');
  return {
    path,
    position: getPosition(text, definition),
    range: getRange(text, definition),
    // @ts-ignore
    // TODO: doesnt seem to pick up the inference
    // from invariant() exception logic
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
  invariant(name, 'Expected ASTNode to have a Name.');
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
