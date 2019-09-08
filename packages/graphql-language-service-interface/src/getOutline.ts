/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Outline, TextToken, TokenKind } from 'graphql-language-service-types';

import { Kind, parse, visit, DefinitionNode, FieldNode, InlineFragmentNode, DocumentNode, FragmentSpreadNode, OperationDefinitionNode, NameNode, FragmentDefinitionNode, SelectionSetNode } from 'graphql';
import { offsetToPosition } from 'graphql-language-service-utils';

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

type OutlineTreeConverterType = { [name: string]: Function };

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
  const meta = (node: DefinitionNode) => ({
    representativeName: node.name as string,
    startPosition: offsetToPosition(docText, node.loc.start),
    endPosition: offsetToPosition(docText, node.loc.end),
    children: node.selectionSet || [],
  });

  return {
    Field: (node: FieldNode) => {
      const tokenizedText = 'alias' in node
        ? [buildToken('plain', node.alias.value), buildToken('plain', ': ')]
        : [];
      tokenizedText.push(buildToken('plain', node.name.value));
      return { tokenizedText, ...meta(node) };
    },
    OperationDefinition: (node: OperationDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', node.operation),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name.value),
      ],

      ...meta(node),
    }),

    Document: (node: DocumentNode) => node.definitions,
    SelectionSet: (node: SelectionSetNode) =>
      concatMap(node.selections, child => {
        return child.kind === INLINE_FRAGMENT ? child.selectionSet : child;
      }),
    Name: (node: NameNode) => node.value,
    FragmentDefinition: (node: FragmentDefinitionNode) => ({
      tokenizedText: [
        buildToken('keyword', 'fragment'),
        buildToken('whitespace', ' '),
        buildToken('class-name', node.name.value),
      ],

      ...meta(node),
    }),

    FragmentSpread: (node: FragmentSpreadNode) => ({
      tokenizedText: [
        buildToken('plain', '...'),
        buildToken('class-name', node.name.value),
      ],

      ...meta(node),
    }),

    InlineFragment: (node: InlineFragmentNode) => node.selectionSet,
  };
}

function buildToken(kind: TokenKind, value: string | undefined): TextToken {
  return { kind, value };
}

function concatMap(arr: Array<any>, fn: Function): Array<any> {
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
