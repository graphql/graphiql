/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { invalidCharacters, normalizeWhitespace } from '../normalizeWhitespace';

describe('QueryEditor', () => {
  it('removes unicode characters', () => {
    const result = normalizeWhitespace(invalidCharacters.join(''));
    expect(result).toEqual(' '.repeat(invalidCharacters.length));
  });
});
