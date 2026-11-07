import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import { inlineFragment } from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

describe('inlineFragment', () => {
  it('replaces the spread with the fragment selections and drops the definition', () => {
    const d = doc(
      '{ user { ...UserFields } } fragment UserFields on User { name email }',
    );
    const result = print(inlineFragment(d, 'UserFields'));

    expect(result).not.toMatch(/\.\.\.UserFields/);
    expect(result).not.toMatch(/fragment UserFields/);
    expect(result).toMatch(/user\s*{\s*name\s+email\s*}/);
  });

  it('replaces every spread site with the fragment selections', () => {
    const d = doc('{ a { ...F } b { ...F } } fragment F on T { x }');
    const result = print(inlineFragment(d, 'F'));

    expect(result).not.toMatch(/\.\.\.F\b/);
    expect(result).toMatch(/a\s*{\s*x\s*}/);
    expect(result).toMatch(/b\s*{\s*x\s*}/);
  });

  it('keeps sibling selections alongside the inlined fields', () => {
    const d = doc(
      '{ user { ...UserFields age } } fragment UserFields on User { name }',
    );
    const result = print(inlineFragment(d, 'UserFields'));

    expect(result).toMatch(/user\s*{\s*name\s+age\s*}/);
  });

  it('replaces a spread nested inside another fragment', () => {
    const d = doc(
      'fragment Outer on User { ...Inner } fragment Inner on User { name }',
    );
    const result = print(inlineFragment(d, 'Inner'));

    expect(result).not.toMatch(/fragment Inner/);
    expect(result).not.toMatch(/\.\.\.Inner/);
    expect(result).toMatch(/fragment Outer on User\s*{\s*name\s*}/);
  });

  it('is a no-op when the fragment does not exist', () => {
    const d = doc('{ user { name } }');
    expect(inlineFragment(d, 'Missing')).toBe(d);
  });
});
