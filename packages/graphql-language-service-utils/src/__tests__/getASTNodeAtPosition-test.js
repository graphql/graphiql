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
import {parse} from 'graphql';
import {describe, it} from 'mocha';

import {Position} from '../Range';
import {getASTNodeAtPosition, pointToOffset} from '../getASTNodeAtPosition';

const doc = `
query A {
field
}

fragment B on B {
  b
}`;

const ast = parse(doc);

describe('getASTNodeAtPosition', () => {
  it('gets the node at the beginning', () => {
    const point = new Position(2, 0);
    const node = getASTNodeAtPosition(doc, ast, point);
    expect(node).to.not.be.undefined;
    if (node != null) {
      expect(node.name.value).to.equal('field');
    }
  });

  it('does not find the node before the beginning', () => {
    const point = new Position(0, 0);
    const node = getASTNodeAtPosition(doc, ast, point);
    expect(node).to.not.be.undefined;
    if (node != null) {
      expect(node.kind).to.equal('Document');
    }
  });

  it('gets the node at the end', () => {
    const point = new Position(2, 5);
    const node = getASTNodeAtPosition(doc, ast, point);
    expect(node).to.not.be.undefined;
    if (node != null) {
      expect(node.name.value).to.equal('field');
    }
  });

  it('does not find the node after the end', () => {
    const point = new Position(4, 0);
    const node = getASTNodeAtPosition(doc, ast, point);
    expect(node).to.not.be.undefined;
    if (node != null) {
      expect(node.kind).to.equal('Document');
    }
  });
});

describe('pointToOffset', () => {
  it('works for single lines', () => {
    const text = 'lorem';
    expect(pointToOffset(text, new Position(0, 2))).to.equal(2);
  });

  it('takes EOL into account', () => {
    const text = 'lorem\n';
    expect(
      pointToOffset(text, new Position(1, 0)),
    ).to.equal(
      text.length,
    );
  });
});
