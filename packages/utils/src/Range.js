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
import type {
  Range as RangeInterface,
  Position as PositionInterface,
} from 'graphql-language-service-types';

export class Range implements RangeInterface {
  start: PositionInterface;
  end: PositionInterface;
  constructor(start: PositionInterface, end: PositionInterface): void {
    this.start = start;
    this.end = end;
  }

  setStart(line: number, character: number): void {
    this.start = new Position(line, character);
  }

  setEnd(line: number, character: number): void {
    this.end = new Position(line, character);
  }

  containsPosition = (position: PositionInterface): boolean => {
    if (this.start.line === position.line) {
      return this.start.character <= position.character;
    } else if (this.end.line === position.line) {
      return this.end.character >= position.character;
    } else {
      return this.start.line <= position.line && this.end.line >= position.line;
    }
  };
}

export class Position implements PositionInterface {
  line: number;
  character: number;
  constructor(line: number, character: number): void {
    this.line = line;
    this.character = character;
  }

  setLine(line: number): void {
    this.line = line;
  }

  setCharacter(character: number): void {
    this.character = character;
  }

  lessThanOrEqualTo = (position: PositionInterface): boolean =>
    this.line < position.line ||
    (this.line === position.line && this.character <= position.character);
}

export function offsetToPosition(text: string, loc: number): Position {
  const EOL = '\n';
  const buf = text.slice(0, loc);
  const lines = buf.split(EOL).length - 1;
  const lastLineIndex = buf.lastIndexOf(EOL);
  return new Position(lines, loc - lastLineIndex - 1);
}

export function locToRange(text: string, loc: Location): Range {
  const start = offsetToPosition(text, loc.start);
  const end = offsetToPosition(text, loc.end);
  return new Range(start, end);
}
