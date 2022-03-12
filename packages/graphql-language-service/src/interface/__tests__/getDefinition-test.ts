/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { parse } from 'graphql';
import {
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForNamedType,
} from '../getDefinition';

describe('getDefinition', () => {
  describe('getDefinitionQueryResultForNamedType', () => {
    it('returns correct Position', async () => {
      const query = `type Query {
        hero(episode: Episode): Character
      }

      type Episode {
        id: ID!
      }
      `;
      const parsedQuery = parse(query);
      // @ts-ignore
      const namedTypeDefinition = parsedQuery.definitions[0].fields[0].type;

      const result = await getDefinitionQueryResultForNamedType(
        query,
        {
          ...namedTypeDefinition,
        },

        [
          {
            // @ts-ignore
            file: 'someFile',
            content: query,
            definition: {
              ...namedTypeDefinition,
            },
          },
        ],
      );
      expect(result.definitions.length).toEqual(1);
      expect(result.definitions[0].position.line).toEqual(1);
      expect(result.definitions[0].position.character).toEqual(32);
    });
  });

  describe('getDefinitionQueryResultForNamedType for scalar', () => {
    it('returns correct Position', async () => {
      const query = `type Query {
        hero(episode: Episode): Json
      }

      type Episode {
        id: ID!
      }

      scalar Json
      `;
      const parsedQuery = parse(query);
      // @ts-ignore
      const namedTypeDefinition = parsedQuery.definitions[0].fields[0].type;

      const result = await getDefinitionQueryResultForNamedType(
        query,
        {
          ...namedTypeDefinition,
        },

        [
          {
            // @ts-ignore
            file: 'someFile',
            content: query,
            definition: {
              ...namedTypeDefinition,
            },
          },
        ],
      );
      expect(result.definitions.length).toEqual(1);
      expect(result.definitions[0].position.line).toEqual(1);
      expect(result.definitions[0].position.character).toEqual(32);
    });
  });

  describe('getDefinitionQueryResultForFragmentSpread', () => {
    it('returns correct Position', async () => {
      const query = `query A {
        ...Duck
      }`;
      const fragment = `# Fragment goes here
      fragment Duck on Duck {
        cuack
      }`;
      // @ts-ignore
      const fragmentSpread = parse(query).definitions[0].selectionSet
        .selections[0];
      const fragmentDefinition = parse(fragment).definitions[0];
      const result = await getDefinitionQueryResultForFragmentSpread(
        query,
        fragmentSpread,
        [
          {
            file: 'someFile',
            content: fragment,
            // @ts-ignore
            definition: fragmentDefinition,
          },
        ],
      );
      expect(result.definitions.length).toEqual(1);
      expect(result.definitions[0].position.line).toEqual(1);
      expect(result.definitions[0].position.character).toEqual(6);
    });
  });
});
