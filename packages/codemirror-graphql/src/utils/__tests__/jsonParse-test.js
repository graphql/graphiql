/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';
import jsonParse from '../jsonParse';

describe('jsonParse', () => {
  function checkEscapedString(str, key, value) {
    const ast = jsonParse(str);
    expect(ast.kind).to.equal('Object');
    expect(ast.members[0].key).to.deep.equal(key);
    expect(ast.members[0].value).to.deep.equal(value);
  }

  it('correctly parses escaped strings', () => {
    checkEscapedString(
      '{ "test": "\\"" }',
      {kind: 'String', start: 2, end: 8, value: 'test'},
      {kind: 'String', start: 10, end: 14, value: '"'},
    );
    checkEscapedString(
      '{ "test": "\\\\" }',
      {kind: 'String', start: 2, end: 8, value: 'test'},
      {kind: 'String', start: 10, end: 14, value: '\\'},
    );
    checkEscapedString(
      '{ "slash": "\\/" }',
      {kind: 'String', start: 2, end: 9, value: 'slash'},
      {kind: 'String', start: 11, end: 15, value: '/'},
    );
  });
});
