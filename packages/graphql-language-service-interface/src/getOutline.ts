/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Outline, TextToken, TokenKind } from 'graphql-language-service-types';

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
  DefinitionNode,
} from 'graphql';
import { offsetToPosition, Position } from 'graphql-language-service-utils';

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
};

type OutlineTreeResult = {
  representativeName: string;
  startPosition: Position;
  endPosition: Position;
  children: SelectionSetNode[] | [];
  tokenizedText: TextToken[];
};

type OutlineTreeConverterType = {
  [name: string]: (
    node: any,
  ) =>
    | OutlineTreeResult
    | SelectionSetNode
    | readonly DefinitionNode[]
    | readonly SelectionNode[]
    | string;
};

export function getOutline(queryText: string): Outline | null | undefined {
  let ast;
  try {
    ast = parse(queryText);
  } catch (error) {
    return null;
  }

  const visitorFns = outlineTreeConverter(queryText);
  const outlineTrees = visit(ast, {
    leave(node) {
      if (
        OUTLINEABLE_KINDS.hasOwnProperty(node.kind) &&
        visitorFns[node.kind]
      ) {
        return visitorFns[node.kind](node);
      }
      return null;
    },
  });

  return { outlineTrees };
}

function outlineTreeConverter(docText: string): OutlineTreeConverterType {
  // TODO: couldn't find a type that would work for all cases here,
  // however the inference is not broken by this at least
  const meta = (node: any) => ({
    representativeName: node.name,
    startPosition: offsetToPosition(docText, node.loc.start),
    endPosition: offsetToPosition(docText, node.loc.end),
    kind: node.kind,
    children: node.selectionSet || [],
  });

  return {
    Field: (node: FieldNode) => {
      const tokenizedText = node.alias
        ? [
            buildToken('plain', (node.alias as unknown) as string),
            buildToken('plain', ': '),
          ]
        : [];
      tokenizedText.push(buildToken('plain', (node.name as unknown) as string));
      return { tokenizedText, ...meta(node) };
    },
    OperationDefinition: (node: OperationDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', node.operation),
        buildToken('whitespace', ' '),
        buildToken('class-name', (node.name as unknown) as string),
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
        buildToken('class-name', (node.name as unknown) as string),
      ],
      ...meta(node),
    }),

    FragmentSpread: (node: FragmentSpreadNode) => ({
      tokenizedText: [
        buildToken('plain', '...'),
        buildToken('class-name', (node.name as unknown) as string),
      ],
      ...meta(node),
    }),

    InlineFragment: (node: InlineFragmentNode) => node.selectionSet,
  };
}

function buildToken(kind: TokenKind, value: string | undefined): TextToken {
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
