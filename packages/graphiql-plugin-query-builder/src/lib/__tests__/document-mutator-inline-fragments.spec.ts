import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  addInlineFragment,
  removeInlineFragment,
  isInlineFragmentPresent,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// ---------------------------------------------------------------------------
// isInlineFragmentPresent
// ---------------------------------------------------------------------------

describe('isInlineFragmentPresent', () => {
  it('returns false when there is no inline fragment at the path', () => {
    const d = doc('{ search { __typename } }');
    expect(isInlineFragmentPresent(d, ['search'], 'Human')).toBe(false);
  });

  it('returns true when an inline fragment is present at the path', () => {
    const d = doc('{ search { ... on Human { name } } }');
    expect(isInlineFragmentPresent(d, ['search'], 'Human')).toBe(true);
  });

  it('returns false for a different type condition at the same path', () => {
    const d = doc('{ search { ... on Human { name } } }');
    expect(isInlineFragmentPresent(d, ['search'], 'Droid')).toBe(false);
  });

  it('returns true for a deeply nested inline fragment', () => {
    const d = doc(
      '{ hero { companions { ... on Droid { primaryFunction } } } }',
    );
    expect(isInlineFragmentPresent(d, ['hero', 'companions'], 'Droid')).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// addInlineFragment
// ---------------------------------------------------------------------------

describe('addInlineFragment', () => {
  it('adds an inline fragment to a field that has no inline fragments yet', () => {
    const d = doc('{ search { __typename } }');
    const result = addInlineFragment(d, ['search'], 'Human');
    const printed = print(result);
    expect(printed).toContain('... on Human');
    expect(isInlineFragmentPresent(result, ['search'], 'Human')).toBe(true);
  });

  it('adds a second inline fragment without removing the first', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const result = addInlineFragment(d, ['search'], 'Droid');
    expect(isInlineFragmentPresent(result, ['search'], 'Human')).toBe(true);
    expect(isInlineFragmentPresent(result, ['search'], 'Droid')).toBe(true);
  });

  it('is a no-op when the inline fragment already exists', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const result = addInlineFragment(d, ['search'], 'Human');
    // Same document — no duplicate added
    const printed = print(result);
    const matches = printed.match(/\.\.\. on Human/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('creates the field selection set when the field has none', () => {
    const d = doc('{ search }');
    const result = addInlineFragment(d, ['search'], 'Human');
    expect(isInlineFragmentPresent(result, ['search'], 'Human')).toBe(true);
  });

  it('produces parseable output', () => {
    const d = doc('{ search { __typename } }');
    const result = addInlineFragment(d, ['search'], 'Human');
    expect(() => print(result)).not.toThrow();
  });

  it('adds at a nested path', () => {
    const d = doc('{ hero { companions { __typename } } }');
    const result = addInlineFragment(d, ['hero', 'companions'], 'Droid');
    expect(
      isInlineFragmentPresent(result, ['hero', 'companions'], 'Droid'),
    ).toBe(true);
  });

  it('creates the parent field when the path does not resolve to an existing one', () => {
    const d = doc('{ hero }');
    const result = addInlineFragment(d, ['nonexistent'], 'Human');
    // The previously-absent field is created with the fragment inside it; the
    // existing selection is preserved.
    expect(isInlineFragmentPresent(result, ['nonexistent'], 'Human')).toBe(
      true,
    );
    expect(print(result)).toContain('hero');
  });

  it('includes __typename in the new fragment selection set', () => {
    const d = doc('{ search }');
    const result = addInlineFragment(d, ['search'], 'Human');
    const printed = print(result);
    expect(printed).toContain('__typename');
  });
});

// ---------------------------------------------------------------------------
// removeInlineFragment
// ---------------------------------------------------------------------------

describe('removeInlineFragment', () => {
  it('removes an existing inline fragment from the path', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const result = removeInlineFragment(d, ['search'], 'Human');
    expect(isInlineFragmentPresent(result, ['search'], 'Human')).toBe(false);
  });

  it('leaves sibling inline fragments intact', () => {
    const d = doc(
      '{ search { ... on Human { name } ... on Droid { primaryFunction } } }',
    );
    const result = removeInlineFragment(d, ['search'], 'Human');
    expect(isInlineFragmentPresent(result, ['search'], 'Human')).toBe(false);
    expect(isInlineFragmentPresent(result, ['search'], 'Droid')).toBe(true);
  });

  it('is a no-op when the inline fragment does not exist', () => {
    const d = doc('{ search { __typename } }');
    const result = removeInlineFragment(d, ['search'], 'Human');
    expect(print(result)).toBe(print(d));
  });

  it('produces parseable output', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const result = removeInlineFragment(d, ['search'], 'Human');
    expect(() => print(result)).not.toThrow();
  });

  it('removes at a nested path', () => {
    const d = doc(
      '{ hero { companions { ... on Droid { primaryFunction } } } }',
    );
    const result = removeInlineFragment(d, ['hero', 'companions'], 'Droid');
    expect(
      isInlineFragmentPresent(result, ['hero', 'companions'], 'Droid'),
    ).toBe(false);
  });

  it('is a no-op when the path does not resolve to a field', () => {
    const d = doc('{ hero }');
    const result = removeInlineFragment(d, ['nonexistent'], 'Human');
    expect(print(result)).toBe(print(d));
  });

  it('prunes a variable orphaned by the removed fragment', () => {
    const d = doc(
      'query A($x: ID) { hero { ... on Human { f(id: $x) } } other }',
    );
    const result = removeInlineFragment(d, ['hero'], 'Human');
    const printed = print(result);
    // The fragment (and the now-empty hero) are gone; $x is no longer used.
    expect(printed).not.toContain('$x');
    expect(printed).toContain('other');
  });
});

// ---------------------------------------------------------------------------
// Round-trip / print checks
// ---------------------------------------------------------------------------

describe('addInlineFragment / removeInlineFragment round-trip', () => {
  it('adding then removing restores the original document', () => {
    const d = doc('{ search { __typename } }');
    const added = addInlineFragment(d, ['search'], 'Human');
    const removed = removeInlineFragment(added, ['search'], 'Human');
    expect(print(removed)).toBe(print(d));
  });

  it('multiple add/remove cycles stay consistent', () => {
    const d = doc('{ search }');
    const a1 = addInlineFragment(d, ['search'], 'Human');
    const a2 = addInlineFragment(a1, ['search'], 'Droid');
    const r1 = removeInlineFragment(a2, ['search'], 'Human');
    expect(isInlineFragmentPresent(r1, ['search'], 'Human')).toBe(false);
    expect(isInlineFragmentPresent(r1, ['search'], 'Droid')).toBe(true);
  });
});
