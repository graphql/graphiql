import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  addInlineFragment,
  fieldSegment,
  inlineFragmentSegment,
  isFieldSelected,
  removeInlineFragment,
  setFieldArgument,
  toggleFieldSelection,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// Fields inside inline fragments resolve to a path inside the fragment, not
// as a sibling of the fragment or of the parent field.
describe('inline fragment path segments', () => {
  it('toggleFieldSelection adds a field inside the fragment, not as a sibling', () => {
    const d2 = toggleFieldSelection(
      doc('{ union { ... on First { __typename } } }'),
      [
        fieldSegment('union'),
        inlineFragmentSegment('First'),
        fieldSegment('name'),
      ],
      { kind: 'operation' },
    );
    const printed = print(d2);
    expect(printed).toContain('... on First');
    expect(printed).toContain('name');
    // name must appear inside the fragment, not as a direct child of union.
    expect(printed).not.toMatch(/union\s*\{\s*name/);
  });

  it('isFieldSelected with inline fragment segment is true after toggle', () => {
    const d = doc('{ union { ... on First { name } } }');
    expect(
      isFieldSelected(
        d,
        [
          fieldSegment('union'),
          inlineFragmentSegment('First'),
          fieldSegment('name'),
        ],
        { kind: 'operation' },
      ),
    ).toBe(true);
  });

  it('isFieldSelected with plain field path is false (field is inside fragment, not direct child)', () => {
    const d = doc('{ union { ... on First { name } } }');
    expect(
      isFieldSelected(d, [fieldSegment('union'), fieldSegment('name')], {
        kind: 'operation',
      }),
    ).toBe(false);
  });

  it('addInlineFragment adds fragment to an already-selected field', () => {
    const d = doc('{ union { __typename } }');
    const result = addInlineFragment(d, [fieldSegment('union')], 'First', {
      kind: 'operation',
    });
    const printed = print(result);
    expect(printed).toContain('union');
    expect(printed).toContain('... on First');
    expect(printed).toContain('__typename');
  });

  it('addInlineFragment creates the parent field when it is absent', () => {
    const result = addInlineFragment(
      doc('{ id }'),
      [fieldSegment('union')],
      'First',
      { kind: 'operation' },
    );
    expect(
      isFieldSelected(
        result,
        [fieldSegment('union'), inlineFragmentSegment('First')],
        { kind: 'operation' },
      ),
    ).toBe(true);
    const printed = print(result);
    expect(printed).toContain('... on First');
    expect(printed).toContain('id');
  });

  it('removing the last field inside a fragment prunes the fragment and parent field', () => {
    const d = doc('{ union { ... on First { name } } }');
    const result = toggleFieldSelection(
      d,
      [
        fieldSegment('union'),
        inlineFragmentSegment('First'),
        fieldSegment('name'),
      ],
      { kind: 'operation' },
    );
    const printed = print(result);
    expect(printed).not.toContain('union');
  });

  it('setFieldArgument targets a field inside an inline fragment', () => {
    const d = doc('{ union { ... on First { f } } }');
    const { Kind } = require('graphql') as typeof import('graphql');
    const result = setFieldArgument(
      d,
      [
        fieldSegment('union'),
        inlineFragmentSegment('First'),
        fieldSegment('f'),
      ],
      'a',
      { kind: Kind.INT, value: '1' },
      { kind: 'operation' },
    );
    const printed = print(result);
    expect(printed).toContain('... on First');
    expect(printed).toContain('f(a: 1)');
    expect(printed).not.toMatch(/union\s*\{\s*f\(a: 1\)/);
  });

  it('round-trip: add inline fragment via path then check presence', () => {
    const d = doc('{ union { __typename } }');
    const result = addInlineFragment(d, [fieldSegment('union')], 'Second', {
      kind: 'operation',
    });
    const printed = print(result);
    expect(printed).toContain('... on Second');
    expect(printed).toContain('__typename');
  });

  it('removeInlineFragment with absent parent is a no-op', () => {
    const d = doc('{ __typename }');
    const result = removeInlineFragment(d, [fieldSegment('union')], 'First', {
      kind: 'operation',
    });
    expect(print(result)).toBe(print(d));
  });
});
