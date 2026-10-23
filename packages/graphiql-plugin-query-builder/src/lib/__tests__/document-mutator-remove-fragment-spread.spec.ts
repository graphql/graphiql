import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import { fieldSegment, removeFragmentSpread } from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

const FRAG = 'fragment UserFields on User { name }';

describe('removeFragmentSpread', () => {
  it('removes the spread but keeps sibling selections on the field', () => {
    const d = doc(`{ user { ...UserFields age } } ${FRAG}`);
    const result = print(
      removeFragmentSpread(d, [fieldSegment('user')], 'UserFields', {
        kind: 'operation',
      }),
    );
    expect(result).not.toMatch(/\.\.\.UserFields/);
    expect(result).toMatch(/user\s*{\s*age\s*}/);
    // The fragment definition itself is untouched.
    expect(result).toMatch(/fragment UserFields on User/);
  });

  it('prunes the field when the spread was its only selection', () => {
    const d = doc(`{ user { ...UserFields } other } ${FRAG}`);
    const result = print(
      removeFragmentSpread(d, [fieldSegment('user')], 'UserFields', {
        kind: 'operation',
      }),
    );
    expect(result).not.toMatch(/\.\.\.UserFields/);
    expect(result).not.toMatch(/\buser\b/);
    expect(result).toMatch(/\bother\b/);
  });

  it('is a no-op when the named spread is not present', () => {
    const d = doc(`{ user { ...UserFields } } ${FRAG}`);
    const result = removeFragmentSpread(d, [fieldSegment('user')], 'Missing', {
      kind: 'operation',
    });
    expect(result).toBe(d);
  });

  it('removes a spread from within a fragment definition', () => {
    const d = doc('fragment Outer on User { ...UserFields name } ' + FRAG);
    const result = print(
      removeFragmentSpread(d, [], 'UserFields', {
        kind: 'fragment',
        name: 'Outer',
      }),
    );
    expect(result).toMatch(/fragment Outer on User\s*{\s*name\s*}/);
    // The referenced fragment definition still exists.
    expect(result).toMatch(/fragment UserFields on User/);
  });
});
