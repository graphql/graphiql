import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  addInlineFragment,
  inlineFragmentSegment,
  isFieldSelected,
  removeInlineFragment,
  setFieldArgument,
  toggleFieldSelection,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// ---------------------------------------------------------------------------
// Bug fix: fields inside inline fragments use the correct path
// ---------------------------------------------------------------------------

describe('inline fragment path segments', () => {
  it('toggleFieldSelection adds a field inside the fragment, not as a sibling', () => {
    // Start from a doc with an inline fragment — add a field inside it
    const d2 = toggleFieldSelection(
      doc('{ union { ... on First { __typename } } }'),
      ['union', inlineFragmentSegment('First'), 'name'],
    );
    const printed = print(d2);
    expect(printed).toContain('... on First');
    expect(printed).toContain('name');
    // name must appear INSIDE the inline fragment, not as a direct child of union
    // The printed form should be: union { ... on First { __typename name } }
    expect(printed).not.toMatch(/union\s*\{\s*name/);
  });

  it('isFieldSelected with inline fragment segment is true after toggle', () => {
    const d = doc('{ union { ... on First { name } } }');
    expect(
      isFieldSelected(d, ['union', inlineFragmentSegment('First'), 'name']),
    ).toBe(true);
  });

  it('isFieldSelected with plain field path is false (field is inside fragment, not direct child)', () => {
    const d = doc('{ union { ... on First { name } } }');
    expect(isFieldSelected(d, ['union', 'name'])).toBe(false);
  });

  it('addInlineFragment adds fragment to an already-selected field', () => {
    const d = doc('{ union { __typename } }');
    const result = addInlineFragment(d, ['union'], 'First');
    const printed = print(result);
    expect(printed).toContain('union');
    expect(printed).toContain('... on First');
    expect(printed).toContain('__typename');
  });

  it('addInlineFragment creates the parent field when it is absent', () => {
    // The abstract field has no selection yet — toggling the fragment must
    // still work, creating `union { ... on First { __typename } }`.
    const result = addInlineFragment(doc('{ id }'), ['union'], 'First');
    expect(
      isFieldSelected(result, ['union', inlineFragmentSegment('First')]),
    ).toBe(true);
    const printed = print(result);
    expect(printed).toContain('... on First');
    expect(printed).toContain('id');
  });

  it('removing the last field inside a fragment prunes the fragment and parent field', () => {
    const d = doc('{ union { ... on First { name } } }');
    // name is the only field; removing it should prune the fragment, then union
    const result = toggleFieldSelection(d, [
      'union',
      inlineFragmentSegment('First'),
      'name',
    ]);
    // The operation should have no selections left (or union pruned entirely)
    const printed = print(result);
    expect(printed).not.toContain('union');
  });

  it('setFieldArgument targets a field inside an inline fragment', () => {
    const d = doc('{ union { ... on First { f } } }');
    const { Kind } = require('graphql') as typeof import('graphql');
    const result = setFieldArgument(
      d,
      ['union', inlineFragmentSegment('First'), 'f'],
      'a',
      { kind: Kind.INT, value: '1' },
    );
    const printed = print(result);
    expect(printed).toContain('... on First');
    expect(printed).toContain('f(a: 1)');
    // Argument should be inside the fragment
    expect(printed).not.toMatch(/union\s*\{\s*f\(a: 1\)/);
  });

  it('round-trip: add inline fragment via path then check presence', () => {
    const d = doc('{ union { __typename } }');
    const result = addInlineFragment(d, ['union'], 'Second');
    const printed = print(result);
    expect(printed).toContain('... on Second');
    // The __typename seeded in the fragment should be inside the fragment
    expect(printed).toContain('__typename');
  });

  it('removeInlineFragment with absent parent is a no-op', () => {
    const d = doc('{ __typename }');
    const result = removeInlineFragment(d, ['union'], 'First');
    expect(print(result)).toBe(print(d));
  });
});
