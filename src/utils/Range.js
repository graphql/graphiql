/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {Location} from 'graphql/language';

export class Range {
  start: Point;
  end: Point;
  constructor(start: Point, end: Point): void {
    this.start = start;
    this.end = end;
  }

  containsPoint(point: Point): boolean {
    const withinRow =
      this.start.row <= point.row && this.end.row >= point.row;
    const withinColumn =
      this.start.column <= point.column && this.end.column >= point.column;
    return withinRow && withinColumn;
  }
}

export class Point {
  row: number;
  column: number;
  constructor(row: number, column: number): void {
    this.row = row;
    this.column = column;
  }

  lessThanOrEqualTo(point: Point): boolean {
    if (
      this.row < point.row ||
      (this.row === point.row && this.column <= point.column)
    ) {
      return true;
    }

    return false;
  }
}

export function offsetToPoint(text: string, loc: number): Point {
  const EOL = '\n';
  const buf = text.slice(0, loc);
  const rows = buf.split(EOL).length - 1;
  const lastLineIndex = buf.lastIndexOf(EOL);
  return new Point(rows, loc - lastLineIndex - 1);
}

export function locToRange(text: string, loc: Location): Range {
  const start = offsetToPoint(text, loc.start);
  const end = offsetToPoint(text, loc.end);
  return new Range(start, end);
}
