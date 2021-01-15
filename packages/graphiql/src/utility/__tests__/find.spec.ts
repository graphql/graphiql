/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import find from '../find';

describe('Find', () => {
  it('should return first array element which returns true for predicate', () => {
    expect(find([1, 2, 3], num => num === 2)).toEqual(2);
  });

  it("should return undefined if element which returns true for predicate doesn't exist in the array", () => {
    expect(find([1, 2, 3], num => num === 4)).toBeUndefined();
  });
});
