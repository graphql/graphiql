/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { invalidCharacters, normalizeWhitespace } from '../normalizeWhitespace';

describe('QueryEditor', () => {
  it('removes unicode characters', () => {
    const result = normalizeWhitespace(invalidCharacters.join(''));
    expect(result).to.equal(' '.repeat(invalidCharacters.length));
  });
});
