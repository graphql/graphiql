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

import {getGraphQLConfig} from '../getGraphQLConfig';
import {GraphQLConfig} from '../GraphQLConfig';

const CONFIG_DIR = __dirname;

describe('getGraphQLConfig', () => {
  it('generates GraphQLConfig correctly', async () => {
    const config = await getGraphQLConfig(CONFIG_DIR);
    expect(config instanceof GraphQLConfig).to.equal(true);
  });
});
