/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { IPosition as TPosition } from '../types';
import { ASTNode, visit } from 'graphql';

export function getASTNodeAtPosition(
  query: string,
  ast: ASTNode,
  point: TPosition,
): ASTNode | undefined {
  const offset = pointToOffset(query, point);
  let nodeContainingPosition: ASTNode | undefined;
  visit(ast, {
    enter(node) {
      if (
        node.kind !== 'Name' && // We're usually interested in their parents
        node.loc &&
        node.loc.start <= offset &&
        offset <= node.loc.end
      ) {
        nodeContainingPosition = node;
      } else {
        return false;
      }
    },
    leave(node) {
      if (node.loc && node.loc.start <= offset && offset <= node.loc.end) {
        return false;
      }
    },
  });

  return nodeContainingPosition;
}

export function pointToOffset(text: string, point: TPosition): number {
  const linesUntilPosition = text.split('\n').slice(0, point.line);
  return (
    point.character +
    linesUntilPosition
      .map(
        line => line.length + 1, // count EOL
      )
      .reduce((a, b) => a + b, 0)
  );
}
