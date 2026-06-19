import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  createFragmentFromSelection,
  inlineFragmentSegment,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// ---------------------------------------------------------------------------
// createFragmentFromSelection — inline-fragment path segments (Step 3 fix)
// ---------------------------------------------------------------------------

describe('createFragmentFromSelection with inline-fragment path segments', () => {
  it('extracts selections from an inline fragment into a named fragment', () => {
    // Build: { search { ... on Human { name appearsIn } } }
    const d = doc('{ search { ... on Human { name appearsIn } } }');
    const path = ['search', inlineFragmentSegment('Human')];

    const result = createFragmentFromSelection(
      d,
      path,
      'HumanDetails',
      'Human',
    );
    const printed = print(result);

    // The fragment definition must exist.
    expect(printed).toMatch(/fragment HumanDetails on Human/);
    // The extracted fields appear in the fragment.
    expect(printed).toMatch(/name/);
    expect(printed).toMatch(/appearsIn/);
    // The operation now has a spread instead of the inlined selections.
    expect(printed).toMatch(/\.\.\.HumanDetails/);
    // The document is parseable.
    expect(() => parse(printed)).not.toThrow();
  });

  it('produces exactly two definitions: operation + fragment', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const path = ['search', inlineFragmentSegment('Human')];

    const result = createFragmentFromSelection(d, path, 'HumanFields', 'Human');

    expect(result.definitions).toHaveLength(2);
    const fragDef = result.definitions.find(
      def => def.kind === 'FragmentDefinition',
    );
    expect(fragDef).toBeDefined();
  });

  it('is not a no-op when the path contains an inline-fragment segment', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const path = ['search', inlineFragmentSegment('Human')];

    const result = createFragmentFromSelection(d, path, 'HumanFields', 'Human');

    // Before the fix, findSelectionSet used Kind.FIELD only and returned
    // undefined for inline-fragment segments, making this a no-op.
    expect(print(result)).not.toBe(print(d));
  });

  it('does nothing when the inline-fragment type is not present', () => {
    const d = doc('{ search { ... on Human { name } } }');
    const path = ['search', inlineFragmentSegment('Droid')];

    const result = createFragmentFromSelection(d, path, 'DroidFields', 'Droid');

    expect(print(result)).toBe(print(d));
  });

  it('handles a deeper path ending at an inline fragment', () => {
    // { hero { friends { ... on Human { name } } } }
    const d = doc('{ hero { friends { ... on Human { name appearsIn } } } }');
    const path = ['hero', 'friends', inlineFragmentSegment('Human')];

    const result = createFragmentFromSelection(
      d,
      path,
      'HumanFriendFields',
      'Human',
    );
    const printed = print(result);

    expect(printed).toMatch(/fragment HumanFriendFields on Human/);
    expect(printed).toMatch(/\.\.\.HumanFriendFields/);
    expect(() => parse(printed)).not.toThrow();
  });
});
