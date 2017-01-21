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
  const fakePath = require.resolve('../getDiagnostics');

  it('catches syntax errors', () => {
    const error = getDiagnostics(fakePath, 'qeury')[0];
    expect(error.text).to.contain('Unexpected Name "qeury"');
    expect(error.filePath).to.equal(fakePath);
  });
});
