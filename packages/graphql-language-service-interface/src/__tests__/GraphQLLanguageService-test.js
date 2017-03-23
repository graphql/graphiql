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

import {GraphQLConfig} from 'graphql-language-service-config';
import {GraphQLLanguageService} from '../GraphQLLanguageService';

const MOCK_CONFIG = {
  inputDirs: ['./queries'],
};

describe('GraphQLLanguageService', () => {
  const mockCache: any = {
    getGraphQLConfig() {
      return new GraphQLConfig(MOCK_CONFIG, __dirname);
    },
  };

  let languageService;
  beforeEach(() => {
    languageService = new GraphQLLanguageService(mockCache);
  });

  it('runs diagnostic service as expected', async () => {
    const diagnostics = await languageService.getDiagnostics(
      'qeury',
      './queries/testQuery.graphql',
    );
    expect(diagnostics.length).to.equal(1);
  });
});
