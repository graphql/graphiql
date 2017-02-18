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

import {getDiagnostics} from '../getDiagnostics';

describe('getDiagnostics', () => {
  it('catches syntax errors', () => {
    const error = getDiagnostics('qeury')[0];
    expect(error.message).to.contain('Unexpected Name "qeury"');
  });
});
