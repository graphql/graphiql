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
    expect(config.getRootDir()).to.equal(CONFIG_DIR));
  it('returns a correct schema path', () => {
    expect(config.getSchemaPath('testWithSchema')).to.equal(
      '__schema__/StarWarsSchema.graphql',
    );
    expect(config.getSchemaPath('testWithoutSchema')).to.equal(null);
  });

  it('returns a correct array of custom directives', () => {
    expect(
      config.getCustomDirectives('testWithCustomDirectives'),
    ).to.deep.equal(['directive @customDirective on FIELD']);
    expect(config.getCustomDirectives('someWeirdProjectName')).to.deep.equal([
      'directive @customDirective on FRAGMENT_SPREAD',
    ]);
  });
});
