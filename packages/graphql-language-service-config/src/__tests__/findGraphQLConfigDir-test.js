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
import path from 'path';

import {findGraphQLConfigDir} from '../findGraphQLConfigDir';

const CONFIG_DIR = __dirname;

describe('findGraphQLConfigDir', () => {
  it('finds GraphQLConfigDir correctly', () =>
    expect(findGraphQLConfigDir(CONFIG_DIR)).to.equal(CONFIG_DIR) &&
    expect(findGraphQLConfigDir(path.join(CONFIG_DIR, '__queries__'))).to.equal(
      CONFIG_DIR
    ));
});
