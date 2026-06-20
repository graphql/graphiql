import { describe, expect, it } from 'vitest';
import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLField,
} from 'graphql';
import { fieldMatchesFilter } from '../field-list-view';

// Build a real type so fields carry name/description/type, then read them back.
const T = new GraphQLObjectType({
  name: 'T',
  fields: {
    viewer: {
      type: GraphQLString,
      description: 'The current user of the session',
    },
    count: { type: GraphQLInt },
    profileType: { type: new GraphQLObjectType({ name: 'Profile', fields: { id: { type: GraphQLString } } }) },
  },
});
const fields = T.getFields();
const field = (name: string): GraphQLField<unknown, unknown> => fields[name]!;

describe('fieldMatchesFilter', () => {
  it('matches on field name, case-insensitively', () => {
    expect(fieldMatchesFilter(field('count'), 'COUN')).toBe(true);
  });

  it('matches on description when the name does not match', () => {
    expect(fieldMatchesFilter(field('viewer'), 'user')).toBe(true);
  });

  it('matches on the named type', () => {
    expect(fieldMatchesFilter(field('profileType'), 'profile')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(fieldMatchesFilter(field('count'), 'zzz')).toBe(false);
  });

  it('treats an empty/whitespace query as a match (no filtering)', () => {
    expect(fieldMatchesFilter(field('count'), '   ')).toBe(true);
  });
});
