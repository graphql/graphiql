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
import {beforeEach, describe, it} from 'mocha';

import {getGraphQLConfig} from '../getGraphQLConfig';

const CONFIG_DIR = __dirname;

describe('GraphQLConfig', () => {
  let config;
  beforeEach(async () => {
    config = await getGraphQLConfig(CONFIG_DIR);
  });

  it('returns a correct root dir', () =>
    expect(config.getRootDir()).to.equal(CONFIG_DIR),
  );
});
