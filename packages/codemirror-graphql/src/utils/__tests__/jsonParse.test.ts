/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
import jsonParse, { ParseTokenOutput } from '../jsonParse';

describe('jsonParse', () => {
  function expectEscapedString(
    str: string,
    key: ParseTokenOutput,
    value: ParseTokenOutput,
  ) {
    const ast = jsonParse(str);
    expect(ast.kind).toBe('Object');
    expect(ast.members[0].key).toStrictEqual(key);
    expect(ast.members[0].value).toStrictEqual(value);
  }

  it('correctly parses escaped strings', () => {
    expectEscapedString(
      '{ "test": "\\"" }',
      { kind: 'String', start: 2, end: 8, value: 'test' },
      { kind: 'String', start: 10, end: 14, value: '"' },
    );
    expectEscapedString(
      '{ "test": "\\\\" }',
      { kind: 'String', start: 2, end: 8, value: 'test' },
      { kind: 'String', start: 10, end: 14, value: '\\' },
    );
    expectEscapedString(
      '{ "slash": "\\/" }',
      { kind: 'String', start: 2, end: 9, value: 'slash' },
      { kind: 'String', start: 11, end: 15, value: '/' },
    );
  });
});
