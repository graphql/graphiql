/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  Outline,
  TextToken,
  TokenKind,
  IPosition,
  OutlineTree,
} from '../types';

import {
  Kind,
  parse,
  visit,
  FieldNode,
  InlineFragmentNode,
  DocumentNode,
  FragmentSpreadNode,
  OperationDefinitionNode,
  NameNode,
  FragmentDefinitionNode,
  SelectionSetNode,
  SelectionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  DefinitionNode,
  InputValueDefinitionNode,
  FieldDefinitionNode,
  EnumValueDefinitionNode,
} from 'graphql';

import { offsetToPosition } from '../utils';

const { INLINE_FRAGMENT } = Kind;

const OUTLINEABLE_KINDS = {
  Field: true,
  OperationDefinition: true,
  Document: true,
  SelectionSet: true,
  Name: true,
  FragmentDefinition: true,
  FragmentSpread: true,
  InlineFragment: true,
  ObjectTypeDefinition: true,
  InputObjectTypeDefinition: true,
  InterfaceTypeDefinition: true,
  EnumTypeDefinition: true,
  EnumValueDefinition: true,
  InputValueDefinition: true,
  FieldDefinition: true,
};

export type OutlineableKinds = keyof typeof OUTLINEABLE_KINDS;

// type OutlineableNodes = FieldNode | OperationDefinitionNode | DocumentNode | SelectionSetNode | NameNode | FragmentDefinitionNode | FragmentSpreadNode |InlineFragmentNode | ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode

type OutlineTreeResult =
  | {
      representativeName: string;
      startPosition: IPosition;
      endPosition: IPosition;
      children: SelectionSetNode[] | [];
      tokenizedText: TextToken[];
    }
  | string
  | readonly DefinitionNode[]
  | readonly SelectionNode[]
  | FieldNode[]
  | SelectionSetNode;

type OutlineTreeConverterType = Partial<{
  [key in OutlineableKinds]: (node: any) => OutlineTreeResult;
}>;

export function getOutline(documentText: string): Outline | null {
  let ast;
  try {
    ast = parse(documentText);
  } catch {
    return null;
  }

  const visitorFns = outlineTreeConverter(documentText);
  const outlineTrees = visit(ast, {
    leave(node) {
      if (visitorFns !== undefined && node.kind in visitorFns) {
        // @ts-ignore
        return visitorFns[node.kind](node);
      }
      return null;
    },
  }) as unknown as OutlineTree[];

  return { outlineTrees };
}

function outlineTreeConverter(docText: string): OutlineTreeConverterType {
  // TODO: couldn't find a type that would work for all cases here,
  // however the inference is not broken by this at least
  const meta = (node: any) => {
    return {
      representativeName: node.name,
      startPosition: offsetToPosition(docText, node.loc.start),
      endPosition: offsetToPosition(docText, node.loc.end),
      kind: node.kind,
      children:
        node.selectionSet || node.fields || node.values || node.arguments || [],
    };
  };

  return {
    Field(node: FieldNode) {
      const tokenizedText = node.alias
        ? [buildToken('plain', node.alias), buildToken('plain', ': ')]
        : [];
      tokenizedText.push(buildToken('plain', node.name));
      return { tokenizedText, ...meta(node) };
    },
    OperationDefinition: (node: OperationDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', node.operation),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name as unknown as string),
      ],
      ...meta(node),
    }),

    Document: (node: DocumentNode) => node.definitions,
    SelectionSet: (node: SelectionSetNode) =>
      concatMap<SelectionNode>(node.selections, (child: SelectionNode) => {
        return child.kind === INLINE_FRAGMENT ? child.selectionSet : child;
      }),
    Name: (node: NameNode) => node.value,
    FragmentDefinition: (node: FragmentDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', 'fragment'),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name),
      ],
      ...meta(node),
    }),
    InterfaceTypeDefinition: (node: InterfaceTypeDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', 'interface'),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name),
      ],
      ...meta(node),
    }),
    EnumTypeDefinition: (node: EnumTypeDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', 'enum'),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name),
      ],
      ...meta(node),
    }),
    EnumValueDefinition: (node: EnumValueDefinitionNode) => ({
      tokenizedText: [buildToken('plain', node.name)],
      ...meta(node),
    }),
    ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', 'type'),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name),
      ],
      ...meta(node),
    }),
    InputObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', 'input'),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name),
      ],
      ...meta(node),
    }),
    FragmentSpread: (node: FragmentSpreadNode) => ({
      tokenizedText: [
        buildToken('plain', '...'),
        buildToken('class-name', node.name),
      ],
      ...meta(node),
    }),
    InputValueDefinition(node: InputValueDefinitionNode) {
      return {
        tokenizedText: [buildToken('plain', node.name)],
        ...meta(node),
      };
    },
    FieldDefinition(node: FieldDefinitionNode) {
      return {
        tokenizedText: [buildToken('plain', node.name)],
        ...meta(node),
      };
    },
    InlineFragment: (node: InlineFragmentNode) => node.selectionSet,
  };
}

function buildToken(kind: TokenKind, value: string | NameNode): TextToken {
  return { kind, value };
}

function concatMap<V>(arr: Readonly<V[]>, fn: Function): Readonly<V[]> {
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const x = fn(arr[i], i);
    if (Array.isArray(x)) {
      res.push(...x);
    } else {
      res.push(x);
    }
  }
  return res;
}
