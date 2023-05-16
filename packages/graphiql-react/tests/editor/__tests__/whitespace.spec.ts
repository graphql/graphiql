import { invalidCharacters, normalizeWhitespace } from '../../../src/editor/whitespace';

describe('normalizeWhitespace', () => {
  it('removes unicode characters', () => {
    const result = normalizeWhitespace(invalidCharacters.join(''));
    expect(result).toEqual(' '.repeat(invalidCharacters.length));
  });
});
