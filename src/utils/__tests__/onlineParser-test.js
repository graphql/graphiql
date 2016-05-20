/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { expect } from 'chai';
import { readFileSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';

import runParser from '../runParser';
import { LexRules, ParseRules, isIgnored } from '../Rules';

describe('onlineParser', () => {
  it('parses kitchen-sink without invalidchar', () => {
    const kitchenSink = readFileSync(
      join(__dirname, '../../__tests__/kitchen-sink.graphql'),
      { encoding: 'utf8' }
    );

    runParser(kitchenSink, {
      eatWhitespace: stream => stream.eatWhile(isIgnored),
      LexRules,
      ParseRules
    }, (stream, state, style) => {
      expect(style).to.not.equal('invalidchar');
    });
  });
});
