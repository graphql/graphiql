import CharacterStream from '../CharacterStream';

describe('CharacterStream', () => {
  describe('getStartOfToken', () => {
    it('returns start postition', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.getStartOfToken()).toEqual(0);
    });
  });

  describe('getCurrentPosition', () => {
    it('returns current postition', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.getCurrentPosition()).toEqual(0);

      stream.next();

      expect(stream.getCurrentPosition()).toEqual(1);
    });
  });

  describe('sol', () => {
    it('returns true if at start of the source string', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.sol()).toEqual(true);

      stream.next();

      expect(stream.sol()).toEqual(false);
    });
  });

  describe('eol', () => {
    it('returns true if end of source string is reached', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eol()).toEqual(false);

      stream.skipToEnd();

      expect(stream.eol()).toEqual(true);
    });
  });

  describe('peak', () => {
    it('returns the next character in source string', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.peek()).toEqual('s');

      stream.next();

      expect(stream.peek()).toEqual('c');
    });

    it('returns null if at end of the source string', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.skipToEnd();

      expect(stream.peek()).toEqual(null);
    });
  });

  describe('next', () => {
    it('increments the current position', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.next();

      expect(stream.getCurrentPosition()).toEqual(1);
    });

    it('returns the next character in source string', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.next()).toEqual('s');
      expect(stream.next()).toEqual('c');
    });
  });

  describe('_testNextCharacter', () => {
    it('tests next character with the pattern provided', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream._testNextCharacter('s')).toEqual(true);

      stream.next();

      expect(stream._testNextCharacter('c')).toEqual(true);
    });

    it('returns correct result with regex pattern', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream._testNextCharacter(/s/)).toEqual(true);
    });

    it('returns correct result with a callback function as pattern', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      const matcher = nextChar => nextChar === 's';

      expect(stream._testNextCharacter(matcher)).toEqual(true);
    });
  });

  describe('eat', () => {
    it('returns next character is matched with the pattern provided', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eat('s')).toEqual('s');
    });

    it('returns undefined is not matched with the pattern provided', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eat('b')).toEqual(undefined);
    });

    it('increments current position after successful match', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.eat('s');

      expect(stream.getCurrentPosition()).toEqual(1);
    });

    it('sets start to current position after successful match', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.next();
      stream.eat('c');

      expect(stream.getStartOfToken()).toEqual(1);
    });
  });

  describe('eatWhile', () => {
    it('returns true if any character matched', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eatWhile(/[_A-Za-z]+/)).toEqual(true);
    });

    it('returns false if no character matched', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eatWhile(/^(?:,)/)).toEqual(false);
    });

    it('increments current position upto where the characters are matched', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.eatWhile(/[_A-Za-z]+/);

      expect(stream.getCurrentPosition()).toEqual(6);
      expect(stream.peek()).toEqual(' ');
    });

    it('sets start to first matched character position', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.skipTo(7);
      stream.eatWhile(/[_A-Za-z]+/);

      expect(stream.getStartOfToken()).toEqual(7);
    });
  });

  describe('eatSpace', () => {
    it('returns true if space found', () => {
      const source = '  scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eatSpace()).toEqual(true);
    });

    it('returns false if no space found', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.eatSpace()).toEqual(false);
    });

    it('increments current position upto where the space is matched', () => {
      const source = '  scalar Foo';
      const stream = new CharacterStream(source);

      stream.eatSpace();

      expect(stream.getCurrentPosition()).toEqual(2);
    });

    it('sets start to last space character position', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.getStartOfToken()).toEqual(0);

      stream.skipTo(6);
      stream.eatSpace();

      expect(stream.getStartOfToken()).toEqual(6);
    });
  });

  describe('skipToEnd', () => {
    it('sets pos to end of the source string', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.skipToEnd();

      expect(stream.getCurrentPosition()).toEqual(10);
    });
  });

  describe('skipTo', () => {
    it('sets pos to the provided index', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.skipTo(2);

      expect(stream.getCurrentPosition()).toEqual(2);
    });
  });

  describe('backUp', () => {
    it('goes back the number of steps provided', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.skipTo(2);

      stream.backUp(1);

      expect(stream.getCurrentPosition()).toEqual(1);
    });
  });

  describe('column', () => {
    it('returns current position', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.skipTo(1);

      expect(stream.getCurrentPosition()).toEqual(1);
    });
  });

  describe('current', () => {
    it('returns the current parsed portion of the source string', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream._start = 1;
      stream.skipTo(6);

      expect(stream.current()).toEqual('calar');
    });
  });

  describe('indentation', () => {
    it('returns 0 for no indendation', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.indentation()).toEqual(0);
    });

    it('returns correct indentation', () => {
      const source = '  scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.indentation()).toEqual(2);
    });

    it('counts tab as 2 spaces in indentation', () => {
      const source = '\tscalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.indentation()).toEqual(2);
    });
  });

  describe('match', () => {
    it('returns false if no match found', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.match('a')).toEqual(false);
    });

    it('returns matches if found', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.match(/scalar/)[0]).toEqual('scalar');
    });

    it('accepts string pattern', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.match('scalar')).toEqual(true);
    });

    it('dose case-insensitve match when caseFold is true', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      expect(stream.match('Scalar', true, true)).toEqual(true);
      expect(stream.match('Scalar', true, false)).toEqual(false);
    });

    it('consumes the source string if a match is found, by default', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.next();
      stream.match('calar');

      expect(stream.getStartOfToken()).toEqual(1);
      expect(stream.getCurrentPosition()).toEqual(6);
    });

    it('does not consumes the source string if no match is found', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.next();
      stream.match(/123/);

      expect(stream.getStartOfToken()).toEqual(0);
      expect(stream.getCurrentPosition()).toEqual(1);
    });

    it('does not consume the source string if marked as false', () => {
      const source = 'scalar Foo';
      const stream = new CharacterStream(source);

      stream.next();
      stream.match('calar', false);

      expect(stream.getStartOfToken()).toEqual(0);
      expect(stream.getCurrentPosition()).toEqual(1);
    });
  });
});
