/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import CharacterStream from '../CharacterStream';

describe('CharacterStream', () => {
  function createStream(testStr) {
    return new CharacterStream(testStr);
  }

  it('returns the match with different pattern types', () => {
    const stream = createStream('query Q { id }');

    expect(stream.match('query', false)).to.equal(true);
    expect(stream.match(/query/, false)).to.not.equal(false);
  });

  it('eats characters/spaces properly', () => {
    const stream = createStream('                 QQQQQQQQQQQQQ { }');

    expect(stream.eat(' ')).to.equal(' ');
    expect(stream.eat('n')).to.equal(undefined);

    stream.eatSpace();
    expect(stream.eat('Q')).to.equal('Q');
    expect(stream.eatWhile('Q')).to.equal(true);
  });

  it('peeks the next character unless at the end of the line', () => {
    const stream = createStream('a');
    expect(stream.sol()).to.equal(true);
    expect(stream.peek()).to.equal('a');
    stream.eat('a');
    expect(stream.eol()).to.equal(true);
    expect(stream.peek()).to.equal(null);
  });

  it('has corrrectly operating skipTo/skipToEnd', () => {
    const stream = createStream('abcdefg');
    stream.skipTo(3);
    expect(stream.peek()).to.equal('d');

    stream.skipToEnd();
    expect(stream.eol()).to.equal(true);
  });

  it('returns a correct start of the token', () => {
    const stream = createStream('query veryLongToken');
    expect(stream.match(/\w+/)[0]).to.equal('query');
    stream.eatSpace();
    expect(stream.match(/\w+/)[0]).to.equal('veryLongToken');
    expect(
      stream._sourceText.substr(stream._start, stream._pos)
    ).to.equal('veryLongToken');
  });
});
