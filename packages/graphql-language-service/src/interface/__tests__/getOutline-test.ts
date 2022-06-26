/**
 *  Copyright (c) 2021 GraphQL Contributors
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
    // @ts-expect-error
    const tree = getOutline(query).outlineTrees;
    expect(tree).not.toBeUndefined();
    expect(tree.length).toEqual(1);
    // @ts-expect-error
    expect(tree[0].startPosition.line).toEqual(0);
    // @ts-expect-error
    expect(tree[0].startPosition.character).toEqual(0);
    // @ts-expect-error
    expect(tree[0].endPosition.line).toEqual(2);
    // @ts-expect-error
    expect(tree[0].endPosition.character).toEqual(5);
    // @ts-expect-error
    expect(tree[0].representativeName).toEqual('test');
    // @ts-expect-error
    expect(tree[0].tokenizedText.length).toEqual(3);
    // @ts-expect-error
    expect(tree[0].tokenizedText[0]).toEqual({
      kind: 'keyword',
      value: 'query',
    });
    // @ts-expect-error
    expect(tree[0].tokenizedText[1]).toEqual({
      kind: 'whitespace',
      value: ' ',
    });
    // @ts-expect-error
    expect(tree[0].tokenizedText[2]).toEqual({
      kind: 'class-name',
      value: 'test',
    });
    // @ts-expect-error
    expect(tree[0].children.length).toEqual(1);
    // @ts-expect-error
    expect(tree[0].children[0].children.length).toEqual(0);
    // @ts-expect-error
    expect(tree[0].children[0].startPosition.line).toEqual(1);
    // @ts-expect-error
    expect(tree[0].children[0].startPosition.character).toEqual(6);
    // @ts-expect-error
    expect(tree[0].children[0].endPosition.line).toEqual(1);
    // @ts-expect-error
    expect(tree[0].children[0].endPosition.character).toEqual(10);
    // @ts-expect-error
    expect(tree[0].children[0].representativeName).toEqual('name');
    // @ts-expect-error
    expect(tree[0].children[0].tokenizedText.length).toEqual(1);
    // @ts-expect-error
    expect(tree[0].children[0].tokenizedText[0]).toEqual({
      kind: 'plain',
      value: 'name',
    });
  });
});
