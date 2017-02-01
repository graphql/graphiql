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
  start: Position;
  end: Position;
  constructor(start: Position, end: Position): void {
    this.start = start;
    this.end = end;
  }

  containsPosition(position: Position): boolean {
    const withinLine =
      this.start.line <= position.line && this.end.line >= position.line;
    const withinCharacter =
      this.start.character <= position.character &&
      this.end.character >= position.character;
    return withinLine && withinCharacter;
  }
}

export class Position {
  line: number;
  character: number;
  constructor(line: number, character: number): void {
    this.line = line;
    this.character = character;
  }

  lessThanOrEqualTo(position: Position): boolean {
    if (
      this.line < position.line ||
      (this.line === position.line && this.character <= position.character)
    ) {
      return true;
    }

    return false;
  }
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
