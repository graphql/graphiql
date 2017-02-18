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
import {parse} from 'graphql';
import {getDefinitionQueryResultForFragmentSpread} from '../getDefinition';

describe('getDefinition', () => {
  describe('getDefinitionQueryResultForFragmentSpread', () => {
    it('returns correct Position', async () => {
      const query = `query A {
        ...Duck
      }`;
      const fragment = `# Fragment goes here
      fragment Duck on Duck {
        cuack
      }`;
      const fragmentSpread =
        parse(query).definitions[0].selectionSet.selections[0];
      const fragmentDefinition = parse(fragment).definitions[0];
      const result = await getDefinitionQueryResultForFragmentSpread(
        query,
        fragmentSpread,
        [{file: 'someFile', content: fragment, definition: fragmentDefinition}],
      );
      expect(result.definitions.length).to.equal(1);
      expect(result.definitions[0].position.line).to.equal(1);
      expect(result.definitions[0].position.character).to.equal(15);
    });
  });
});
