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
import {getOutline} from '../getOutline';

describe('getOutline()', () => {
  it('returns outline trees correctly', () => {
    const query = `query test {
      name
    }`;
    const tree = getOutline(query).outlineTrees;
    expect(tree).to.not.be.undefined;
    expect(tree.length).to.equal(1);
    expect(tree[0].startPosition.line).to.equal(0);
    expect(tree[0].startPosition.character).to.equal(0);
    expect(tree[0].endPosition.line).to.equal(2);
    expect(tree[0].endPosition.character).to.equal(5);
    expect(tree[0].representativeName).to.equal('test');
    expect(tree[0].tokenizedText.length).to.equal(3);
    expect(tree[0].tokenizedText[0]).to.deep.equal({
      kind: 'keyword',
      value: 'query',
    });
    expect(tree[0].tokenizedText[1]).to.deep.equal({
      kind: 'whitespace',
      value: ' ',
    });
    expect(tree[0].tokenizedText[2]).to.deep.equal({
      kind: 'class-name',
      value: 'test',
    });
    expect(tree[0].children.length).to.equal(1);
    expect(tree[0].children[0].children.length).to.equal(0);
    expect(tree[0].children[0].startPosition.line).to.equal(1);
    expect(tree[0].children[0].startPosition.character).to.equal(6);
    expect(tree[0].children[0].endPosition.line).to.equal(1);
    expect(tree[0].children[0].endPosition.character).to.equal(10);
    expect(tree[0].children[0].representativeName).to.equal('name');
    expect(tree[0].children[0].tokenizedText.length).to.equal(1);
    expect(tree[0].children[0].tokenizedText[0]).to.deep.equal({
      kind: 'plain',
      value: 'name',
    });
  });
});
