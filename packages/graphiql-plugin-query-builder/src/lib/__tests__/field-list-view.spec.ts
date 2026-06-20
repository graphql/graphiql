import { describe, expect, it } from 'vitest';
import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLField,
} from 'graphql';
import { fieldMatchesFilter, selectVisibleFields } from '../field-list-view';

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

// A type with 25 plainly-named string fields: f0..f24, in declaration order.
const Wide = new GraphQLObjectType({
  name: 'Wide',
  fields: Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [`f${i}`, { type: GraphQLString }]),
  ),
});
const wideFields = Object.values(Wide.getFields());
const none = () => false;

describe('selectVisibleFields', () => {
  it('shows all fields when at or under the threshold', () => {
    const under = wideFields.slice(0, 20);
    const r = selectVisibleFields({
      fields: under,
      isSelected: none,
      threshold: 20,
      expanded: false,
      filter: '',
    });
    expect(r.visible).toHaveLength(20);
    expect(r.hiddenCount).toBe(0);
  });

  it('caps to the threshold and reports the hidden count', () => {
    const r = selectVisibleFields({
      fields: wideFields,
      isSelected: none,
      threshold: 20,
      expanded: false,
      filter: '',
    });
    expect(r.visible.map(f => f.name)).toEqual(
      wideFields.slice(0, 20).map(f => f.name),
    );
    expect(r.hiddenCount).toBe(5);
  });

  it('shows everything once expanded', () => {
    const r = selectVisibleFields({
      fields: wideFields,
      isSelected: none,
      threshold: 20,
      expanded: true,
      filter: '',
    });
    expect(r.visible).toHaveLength(25);
    expect(r.hiddenCount).toBe(0);
  });

  it('pins a selected field that sorts beyond the cap and excludes it from the hidden count', () => {
    const r = selectVisibleFields({
      fields: wideFields,
      isSelected: name => name === 'f24',
      threshold: 20,
      expanded: false,
      filter: '',
    });
    expect(r.visible.map(f => f.name)).toContain('f24');
    // First 20 (f0..f19) plus the pinned f24 = 21 visible; f20..f23 hidden.
    expect(r.visible).toHaveLength(21);
    expect(r.hiddenCount).toBe(4);
  });

  it('reports zero hidden when every beyond-cap field is selected', () => {
    const r = selectVisibleFields({
      fields: wideFields,
      isSelected: name => ['f20', 'f21', 'f22', 'f23', 'f24'].includes(name),
      threshold: 20,
      expanded: false,
      filter: '',
    });
    expect(r.visible).toHaveLength(25);
    expect(r.hiddenCount).toBe(0);
  });

  it('a filter bypasses the cap and shows all matches', () => {
    // f2 and f12 and f20..f24 all contain "2"
    const r = selectVisibleFields({
      fields: wideFields,
      isSelected: none,
      threshold: 20,
      expanded: false,
      filter: '2',
    });
    expect(r.visible.map(f => f.name)).toEqual(
      wideFields.filter(f => f.name.includes('2')).map(f => f.name),
    );
    expect(r.hiddenCount).toBe(0);
  });
});
