/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {ASTNode} from 'graphql/language';

import {Point} from './Range';
import {visit} from 'graphql';

export function getASTNodeAtPoint(
  query: string,
  ast: ASTNode,
  point: Point,
): ?ASTNode {
  const offset = pointToOffset(query, point);
  let nodeContainingPoint: ?ASTNode;
  visit(ast, {
    enter(node) {
      if (
        node.kind !== 'Name' && // We're usually interested in their parents
        node.loc.start <= offset && offset <= node.loc.end
      ) {
        nodeContainingPoint = node;
      } else {
        return false;
      }
    },
    leave(node) {
      if (node.loc.start <= offset && offset <= node.loc.end) {
        return false;
      }
    },
  });
  return nodeContainingPoint;
}

export function pointToOffset(text: string, point: Point): number {
  const linesUntilPoint = text.split('\n').slice(0, point.row);
  return point.column + linesUntilPoint.map(line =>
    line.length + 1, // count EOL
  ).reduce((a, b) => a + b, 0);
}
