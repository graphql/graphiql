/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Location } from 'graphql';
import { IRange, IPosition } from '../types';

export class Range implements IRange {
  start: IPosition;
  end: IPosition;
  constructor(start: IPosition, end: IPosition) {
    this.start = start;
    this.end = end;
  }

  setStart(line: number, character: number) {
    this.start = new Position(line, character);
  }

  setEnd(line: number, character: number) {
    this.end = new Position(line, character);
  }

  containsPosition = (position: IPosition): boolean => {
    if (this.start.line === position.line) {
      return this.start.character <= position.character;
    }
    if (this.end.line === position.line) {
      return this.end.character >= position.character;
    }
    return this.start.line <= position.line && this.end.line >= position.line;
  };
}

export class Position implements IPosition {
  line: number;
  character: number;
  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  setLine(line: number) {
    this.line = line;
  }

  setCharacter(character: number) {
    this.character = character;
  }

  lessThanOrEqualTo = (position: IPosition): boolean =>
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

export function locStartToPosition(text: string, loc: Location) {
  return loc.startToken?.start === loc.start
    ? new Position(loc.startToken.line - 1, loc.startToken.column - 1)
    : offsetToPosition(text, loc.start);
}

function locEndToPosition(text: string, loc: Location) {
  if (loc.startToken?.start !== loc.start) {
    return offsetToPosition(text, loc.end);
  }
  const EOL = '\n';
  const buf = text.slice(loc.endToken.start, loc.endToken.end);
  const lastLineIndex = buf.lastIndexOf(EOL);
  if (lastLineIndex === -1) {
    return new Position(
      loc.endToken.line - 1,
      loc.endToken.column + buf.length - 1,
    );
  }
  const lines = buf.split(EOL).length - 1;
  return new Position(
    loc.endToken.line - 1 + lines,
    loc.endToken.end - loc.endToken.start - lastLineIndex - 1,
  );
}

export function locToRange(text: string, loc: Location): Range {
  const start = locStartToPosition(text, loc);
  const end =
    loc.endToken?.end === loc.end
      ? locEndToPosition(text, loc)
      : offsetToPosition(text, loc.end);
  return new Range(start, end);
}
