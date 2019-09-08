/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { getOutline } from '../getOutline';

describe('getOutline()', () => {
  it('returns outline trees correctly', () => {
    const query = `query test {
      name
    }`;
    const tree = getOutline(query).outlineTrees;
    expect(tree).not.toBeUndefined;
    expect(tree.length).toEqual(1);
    expect(tree[0].startPosition.line).toEqual(0);
    expect(tree[0].startPosition.character).toEqual(0);
    expect(tree[0].endPosition.line).toEqual(2);
    expect(tree[0].endPosition.character).toEqual(5);
    expect(tree[0].representativeName).toEqual('test');
    expect(tree[0].tokenizedText.length).toEqual(3);
    expect(tree[0].tokenizedText[0]).toEqual({
      kind: 'keyword',
      value: 'query',
    });
    expect(tree[0].tokenizedText[1]).toEqual({
      kind: 'whitespace',
      value: ' ',
    });
    expect(tree[0].tokenizedText[2]).toEqual({
      kind: 'class-name',
      value: 'test',
    });
    expect(tree[0].children.length).toEqual(1);
    expect(tree[0].children[0].children.length).toEqual(0);
    expect(tree[0].children[0].startPosition.line).toEqual(1);
    expect(tree[0].children[0].startPosition.character).toEqual(6);
    expect(tree[0].children[0].endPosition.line).toEqual(1);
    expect(tree[0].children[0].endPosition.character).toEqual(10);
    expect(tree[0].children[0].representativeName).toEqual('name');
    expect(tree[0].children[0].tokenizedText.length).toEqual(1);
    expect(tree[0].children[0].tokenizedText[0]).toEqual({
      kind: 'plain',
      value: 'name' });

  });
});
