import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  fieldSegment,
  listFragmentInfos,
  renameFragment,
  spreadExistingFragment,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

describe('listFragmentInfos', () => {
  it('returns each fragment name with its type condition', () => {
    const d = doc(`
      { hero { ...HeroFields } }
      fragment HeroFields on Hero { name }
      fragment DroidFields on Droid { primaryFunction }
    `);
    expect(listFragmentInfos(d)).toEqual([
      { name: 'HeroFields', typeName: 'Hero' },
      { name: 'DroidFields', typeName: 'Droid' },
    ]);
  });

  it('returns an empty list when there are no fragments', () => {
    expect(listFragmentInfos(doc('{ hero { name } }'))).toEqual([]);
  });
});

describe('spreadExistingFragment', () => {
  it('replaces a field selection with a spread of an existing fragment', () => {
    const d = doc(`
      { hero { name } droid { primaryFunction } }
      fragment HeroFields on Hero { name appearsIn }
    `);
    const result = spreadExistingFragment(
      d,
      [fieldSegment('hero')],
      'HeroFields',
    );
    const printed = print(result);
    expect(printed).toMatch(/hero\s*{\s*\.\.\.HeroFields\s*}/);
    // The existing fragment definition is untouched (no duplicate appended).
    expect(printed.match(/fragment HeroFields/g)).toHaveLength(1);
  });

  it('does not append a new fragment definition', () => {
    const d = doc(`
      { hero { name } }
      fragment HeroFields on Hero { name appearsIn }
    `);
    const before = d.definitions.length;
    const result = spreadExistingFragment(
      d,
      [fieldSegment('hero')],
      'HeroFields',
    );
    expect(result.definitions).toHaveLength(before);
  });

  it('is a no-op when the path does not resolve', () => {
    const d = doc(`
      { hero { name } }
      fragment HeroFields on Hero { name }
    `);
    const result = spreadExistingFragment(
      d,
      [fieldSegment('missing')],
      'HeroFields',
    );
    expect(print(result)).toBe(print(d));
  });
});

describe('renameFragment', () => {
  it('renames the definition and every spread', () => {
    const d = doc(`
      { hero { ...HeroFields } friend { ...HeroFields } }
      fragment HeroFields on Hero { name }
    `);
    const result = renameFragment(d, 'HeroFields', 'HeroBasics');
    const printed = print(result);
    expect(printed).toMatch(/fragment HeroBasics on Hero/);
    expect(printed.match(/\.\.\.HeroBasics/g)).toHaveLength(2);
    expect(printed).not.toMatch(/HeroFields/);
  });

  it('renames spreads inside other fragments', () => {
    const d = doc(`
      { hero { ...Outer } }
      fragment Outer on Hero { ...Inner }
      fragment Inner on Hero { name }
    `);
    const result = renameFragment(d, 'Inner', 'Renamed');
    const printed = print(result);
    expect(printed).toMatch(/fragment Renamed on Hero/);
    expect(printed).toMatch(/\.\.\.Renamed/);
  });

  it('is a no-op when the target fragment does not exist', () => {
    const d = doc(`
      { hero { ...HeroFields } }
      fragment HeroFields on Hero { name }
    `);
    expect(print(renameFragment(d, 'Nope', 'X'))).toBe(print(d));
  });

  it('is a no-op when the new name collides with an existing fragment', () => {
    const d = doc(`
      { hero { ...HeroFields } droid { ...DroidFields } }
      fragment HeroFields on Hero { name }
      fragment DroidFields on Droid { primaryFunction }
    `);
    expect(print(renameFragment(d, 'HeroFields', 'DroidFields'))).toBe(
      print(d),
    );
  });

  it('is a no-op for an empty new name', () => {
    const d = doc(`
      { hero { ...HeroFields } }
      fragment HeroFields on Hero { name }
    `);
    expect(print(renameFragment(d, 'HeroFields', ''))).toBe(print(d));
  });
});
