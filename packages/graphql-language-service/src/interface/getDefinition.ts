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
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  // printType,
  // isNamedType,
  // ArgumentNode,
  InputValueDefinitionNode,
  GraphQLType,
} from 'graphql';

import { Definition, FragmentInfo, Uri, ObjectTypeInfo } from '../types';

import { locToRange, offsetToPosition, Range, Position } from '../utils';
// import { getTypeInfo } from './getAutocompleteSuggestions';

export type DefinitionQueryResult = {
  queryRange: Range[];
  definitions: Definition[];
  printedName?: string;
};

export type DefinitionQueryResponse = DefinitionQueryResult & {
  node?: ASTNode | null;
  type?: GraphQLType | null;
};

export const LANGUAGE = 'GraphQL';

function assert(value: any, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

function getRange(text: string, node: ASTNode): Range {
  const location = node.loc!;
  assert(location, 'Expected ASTNode to have a location.');
  return locToRange(text, location);
}

function getPosition(text: string, node: ASTNode): Position {
  const location = node.loc!;
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
    throw new Error(`Definition not found for GraphQL type ${name}`);
  }
  const definitions: Array<Definition> = defNodes.map(
    ({ filePath, content, definition }) =>
      getDefinitionForNodeDefinition(filePath || '', content, definition),
  );

  return {
    definitions,
    queryRange: definitions.map(_ => getRange(text, node)),
    printedName: name,
  };
}

export async function getDefinitionQueryResultForField(
  fieldName: string,
  typeName: string,
  dependencies: Array<ObjectTypeInfo>,
): Promise<DefinitionQueryResult> {
  const defNodes = dependencies.filter(
    ({ definition }) => definition.name && definition.name.value === typeName,
  );

  if (defNodes.length === 0) {
    throw new Error(`Definition not found for GraphQL type ${typeName}`);
  }

  const definitions: Array<Definition> = [];

  for (const { filePath, content, definition } of defNodes) {
    const fieldDefinition = (
      definition as ObjectTypeDefinitionNode
    ).fields?.find(item => item.name.value === fieldName);

    if (fieldDefinition == null) {
      continue;
    }

    definitions.push(
      getDefinitionForFieldDefinition(filePath || '', content, fieldDefinition),
    );
  }

  return {
    definitions,
    // TODO: seems like it's not using
    queryRange: [],
    printedName: [typeName, fieldName].join('.'),
  };
}

export async function getDefinitionQueryResultForArgument(
  argumentName: string,
  fieldName: string,
  typeName: string,
  dependencies: Array<ObjectTypeInfo>,
): Promise<DefinitionQueryResult> {
  const definitions: Array<Definition> = [];

  for (const { filePath, content, definition } of dependencies) {
    const argDefinition = (definition as ObjectTypeDefinitionNode).fields
      ?.find(item => item.name.value === fieldName)
      ?.arguments?.find(item => item.name.value === argumentName);
    if (argDefinition == null) {
      continue;
    }

    definitions.push(
      getDefinitionForArgumentDefinition(
        filePath || '',
        content,
        argDefinition,
      ),
    );
  }
  return {
    definitions,
    // TODO: seems like it's not using
    queryRange: [],
    printedName: `${[typeName, fieldName].join('.')}(${argumentName})`,
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
    throw new Error(`Definition not found for GraphQL fragment ${name}`);
  }
  const definitions: Array<Definition> = defNodes.map(
    ({ filePath, content, definition }) =>
      getDefinitionForFragmentDefinition(filePath || '', content, definition),
  );
  return {
    definitions,
    queryRange: definitions.map(_ => getRange(text, fragment)),
    printedName: name,
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
    printedName: definition.name?.value,
  };
}

function getDefinitionForFragmentDefinition(
  path: Uri,
  text: string,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
): Definition {
  const { name } = definition;
  if (!name) {
    throw new Error('Expected ASTNode to have a Name.');
  }

  return {
    path,
    position: getPosition(text, definition),
    range: getRange(text, definition),
    // TODO: doesn't seem to pick up the inference
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
  const { name } = definition;
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

// eslint-disable-next-line sonarjs/no-identical-functions
function getDefinitionForFieldDefinition(
  path: Uri,
  text: string,
  definition: FieldDefinitionNode,
): Definition {
  const { name } = definition;
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
// GraphQLString,
// eslint-disable-next-line sonarjs/no-identical-functions
function getDefinitionForArgumentDefinition(
  path: Uri,
  text: string,
  definition: InputValueDefinitionNode,
): Definition {
  const { name } = definition;
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
// GraphQLString,
