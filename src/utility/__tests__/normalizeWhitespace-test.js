
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { invalidCharacters, normalizeWhitespace } from '../normalizeWhitespace';

describe('QueryEditor', () => {
  it('removes unicode characters', () => {
    const result = normalizeWhitespace(invalidCharacters.join(''));
    expect([ ...result ]).to.have.members([ ' ' ]);
  });
});
