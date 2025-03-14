/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Location, parse, getOperationAST, FieldNode } from 'graphql';
import { Range, Position, offsetToPosition, locToRange } from '../Range';

const text = `query test {
  name
}`;
const parsed = parse(text);
const nameNode = getOperationAST(parsed)!.selectionSet.selections[0];

const absRange: Location = {
  start: 15,
  end: 19,
  // @ts-ignore
  startToken: null,
  // @ts-ignore
  endToken: null,
  // @ts-ignore
  source: null,
}; // position of 'name' attribute in the test query

const offsetRangeStart = new Position(1, 2);
const offsetRangeEnd = new Position(1, 6);

describe('Position', () => {
  it('constructs a IPosition object', () => {
    const pos = new Position(3, 5);
    expect(pos).not.toBeUndefined();
    expect(pos.character).toEqual(5);
    expect(pos.line).toEqual(3);
  });

  it('compares IPosition objects', () => {
    const posA = new Position(1, 2);
    const posB = new Position(2, 2);
    const posC = new Position(2, 3);
    expect(posA.lessThanOrEqualTo(posB)).toEqual(true);
    expect(posB.lessThanOrEqualTo(posC)).toEqual(true);
    expect(posC.lessThanOrEqualTo(posA)).toEqual(false);
  });
});

describe('Range', () => {
  let start: Position;
  let end: Position;
  let range: Range;

  beforeAll(() => {
    start = new Position(2, 3);
    end = new Position(2, 5);
    range = new Range(start, end);
  });

  it('constructs a IRange object', () => {
    expect(range).not.toBeUndefined();
    expect(range.start).toEqual(start);
    expect(range.end).toEqual(end);
  });

  it('checks if it contains certain position', () => {
    const posA = new Position(2, 4);
    const posB = new Position(3, 5);
    expect(range.containsPosition(posA)).toEqual(true);
    expect(range.containsPosition(posB)).toEqual(false);
  });
});

describe('offsetToPosition()', () => {
  it('returns the offset to a position', () => {
    const position = offsetToPosition(text, absRange.start);
    expect(position.character).toEqual(offsetRangeStart.character);
    expect(position.line).toEqual(offsetRangeStart.line);
  });
});

describe('locToRange()', () => {
  it('returns the range for a location', () => {
    const range = locToRange(text, absRange);
    expect(range.start.character).toEqual(offsetRangeStart.character);
    expect(range.start.line).toEqual(offsetRangeStart.line);
    expect(range.end.character).toEqual(offsetRangeEnd.character);
    expect(range.end.line).toEqual(offsetRangeEnd.line);
  });
  it('returns the range for a location from a parsed node', () => {
    const range = locToRange(text, nameNode.loc!);
    expect(range.start.character).toEqual(offsetRangeStart.character);
    expect(range.start.line).toEqual(offsetRangeStart.line);
    expect(range.end.character).toEqual(offsetRangeEnd.character);
    expect(range.end.line).toEqual(offsetRangeEnd.line);
  });
  it('returns the same range as offsetToPosition with multiline token', () => {
    const blockText = `mutation test {
      saveMarkdown(markdown: """
        * block
        * multiline
        * string
      """)
    }`;
    const blockParsed = parse(blockText);
    const fieldNode = getOperationAST(blockParsed)!.selectionSet
      .selections[0] as FieldNode;
    const argumentNode = fieldNode.arguments![0];
    const startPosition = offsetToPosition(blockText, argumentNode.loc!.start);
    const endPosition = offsetToPosition(blockText, argumentNode.loc!.end);
    const range = locToRange(blockText, argumentNode.loc!);
    expect(range.start.character).toEqual(startPosition.character);
    expect(range.start.line).toEqual(startPosition.line);
    expect(range.end.character).toEqual(endPosition.character);
    expect(range.end.line).toEqual(endPosition.line);
  });
});
