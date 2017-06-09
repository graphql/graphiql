/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';
import {Range, Position, offsetToPosition, locToRange} from '../Range';

const text = `query test {
  name
}`;
const absRange = {start: 15, end: 18}; // position of 'name' attribute in the test query
const offsetRangeStart = new Position(1, 2);
const offsetRangeEnd = new Position(1, 5);

describe('Position', () => {
  it('constructs a Position object', () => {
    const pos = new Position(3, 5);
    expect(pos).to.not.be.undefined;
    expect(pos.character).to.equal(5);
    expect(pos.line).to.equal(3);
  });

  it('compares Position objects', () => {
    const posA = new Position(1, 2);
    const posB = new Position(2, 2);
    const posC = new Position(2, 3);
    expect(posA.lessThanOrEqualTo(posB)).to.equal(true);
    expect(posB.lessThanOrEqualTo(posC)).to.equal(true);
    expect(posC.lessThanOrEqualTo(posA)).to.equal(false);
  });
});

describe('Range', () => {
  let start;
  let end;
  let range;

  before(() => {
    start = new Position(2, 3);
    end = new Position(2, 5);
    range = new Range(start, end);
  });

  it('constructs a Range object', () => {
    expect(range).to.not.be.undefined;
    expect(range.start).to.deep.equal(start);
    expect(range.end).to.deep.equal(end);
  });

  it('checks if it contains certain position', () => {
    const posA = new Position(2, 4);
    const posB = new Position(3, 5);
    expect(range.containsPosition(posA)).to.equal(true);
    expect(range.containsPosition(posB)).to.equal(false);
  });
});

describe('offsetToPosition()', () => {
  it('returns the offset to a position', () => {
    const position = offsetToPosition(text, absRange.start);
    expect(position.character).to.equal(offsetRangeStart.character);
    expect(position.line).to.equal(offsetRangeStart.line);
  });
});

describe('locToRange()', () => {
  it('returns the range for a location', () => {
    const range = locToRange(text, absRange);
    expect(range.start.character).to.equal(offsetRangeStart.character);
    expect(range.start.line).to.equal(offsetRangeStart.line);
    expect(range.end.character).to.equal(offsetRangeEnd.character);
    expect(range.end.line).to.equal(offsetRangeEnd.line);
  });
});
