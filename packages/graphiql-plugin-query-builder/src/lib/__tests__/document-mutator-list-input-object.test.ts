import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import { setListArgValue, setInputObjectArgValue } from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// ---------------------------------------------------------------------------
// setListArgValue
// ---------------------------------------------------------------------------

describe('setListArgValue', () => {
  it('sets a list of string scalars on a field', () => {
    const d = doc('{ search }');
    const result = setListArgValue(d, ['search'], 'tags', ['alpha', 'beta']);
    const printed = print(result);
    expect(printed).toMatch(/tags: \["alpha", "beta"\]/);
  });

  it('sets a list of int scalars', () => {
    const d = doc('{ items }');
    const result = setListArgValue(d, ['items'], 'ids', [1, 2, 3]);
    const printed = print(result);
    expect(printed).toMatch(/ids: \[1, 2, 3\]/);
  });

  it('sets an empty list', () => {
    const d = doc('{ search }');
    const result = setListArgValue(d, ['search'], 'tags', []);
    const printed = print(result);
    expect(printed).toMatch(/tags: \[\]/);
  });

  it('replaces an existing list arg', () => {
    const d = doc('{ search(tags: ["old"]) }');
    const result = setListArgValue(d, ['search'], 'tags', ['new']);
    const printed = print(result);
    expect(printed).toMatch(/tags: \["new"\]/);
    expect(printed).not.toMatch(/old/);
  });

  it('removes the arg when passed undefined', () => {
    const d = doc('{ search(tags: ["a"]) }');
    const result = setListArgValue(d, ['search'], 'tags', undefined);
    const printed = print(result);
    expect(printed).not.toMatch(/tags/);
  });

  it('produces a parseable document', () => {
    const d = doc('{ search }');
    const result = setListArgValue(d, ['search'], 'tags', ['foo', 'bar']);
    expect(() => parse(print(result))).not.toThrow();
  });

  it('works on a nested field', () => {
    const d = doc('{ hero { friends } }');
    const result = setListArgValue(d, ['hero', 'friends'], 'ids', ['x', 'y']);
    const printed = print(result);
    expect(printed).toMatch(/friends\(ids: \["x", "y"\]\)/);
  });

  it('does nothing when the field path does not exist', () => {
    const d = doc('{ hero }');
    const result = setListArgValue(d, ['droid'], 'ids', ['x']);
    expect(print(result)).toBe(print(d));
  });

  it('sets a list of input objects', () => {
    const d = doc('{ createTags }');
    const result = setListArgValue(d, ['createTags'], 'tags', [
      { name: 'a', value: '1' },
      { name: 'b' },
    ]);
    const printed = print(result);
    expect(printed).toMatch(/tags:/);
    expect(printed).toMatch(/name: "a"/);
    expect(printed).toMatch(/name: "b"/);
    expect(() => parse(printed)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// setInputObjectArgValue
// ---------------------------------------------------------------------------

describe('setInputObjectArgValue', () => {
  it('sets a simple input object arg', () => {
    const d = doc('{ createTag }');
    const result = setInputObjectArgValue(d, ['createTag'], 'input', { name: 'alpha' });
    const printed = print(result);
    expect(printed).toMatch(/input: \{name: "alpha"\}|input: \{ name: "alpha" \}/);
  });

  it('sets an input object with multiple fields', () => {
    const d = doc('{ createTag }');
    const result = setInputObjectArgValue(d, ['createTag'], 'input', { name: 'foo', value: 'bar' });
    const printed = print(result);
    expect(printed).toMatch(/name: "foo"/);
    expect(printed).toMatch(/value: "bar"/);
  });

  it('handles boolean field values', () => {
    const d = doc('{ create }');
    const result = setInputObjectArgValue(d, ['create'], 'opts', { enabled: true });
    const printed = print(result);
    expect(printed).toMatch(/enabled: true/);
  });

  it('handles numeric field values', () => {
    const d = doc('{ create }');
    const result = setInputObjectArgValue(d, ['create'], 'opts', { count: 42 });
    const printed = print(result);
    expect(printed).toMatch(/count: 42/);
  });

  it('replaces an existing input object arg', () => {
    const d = doc('{ createTag(input: {name: "old"}) }');
    const result = setInputObjectArgValue(d, ['createTag'], 'input', { name: 'new' });
    const printed = print(result);
    expect(printed).toMatch(/name: "new"/);
    expect(printed).not.toMatch(/old/);
  });

  it('removes the arg when passed undefined', () => {
    const d = doc('{ createTag(input: {name: "foo"}) }');
    const result = setInputObjectArgValue(d, ['createTag'], 'input', undefined);
    const printed = print(result);
    expect(printed).not.toMatch(/input/);
  });

  it('sets an empty object', () => {
    const d = doc('{ create }');
    const result = setInputObjectArgValue(d, ['create'], 'opts', {});
    const printed = print(result);
    expect(printed).toMatch(/opts: \{\}/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('produces a parseable document', () => {
    const d = doc('{ createTag }');
    const result = setInputObjectArgValue(d, ['createTag'], 'input', { name: 'alpha', value: '1' });
    expect(() => parse(print(result))).not.toThrow();
  });

  it('does nothing when the field path does not exist', () => {
    const d = doc('{ hero }');
    const result = setInputObjectArgValue(d, ['droid'], 'input', { name: 'x' });
    expect(print(result)).toBe(print(d));
  });

  it('works on a nested field path', () => {
    const d = doc('{ hero { update } }');
    const result = setInputObjectArgValue(d, ['hero', 'update'], 'input', { name: 'Luke' });
    const printed = print(result);
    expect(printed).toMatch(/update\(input: \{name: "Luke"\}\)|update\(input: \{ name: "Luke" \}\)/);
  });
});

// ---------------------------------------------------------------------------
// Mixed: list of input objects
// ---------------------------------------------------------------------------

describe('list of input objects (mixed case)', () => {
  it('produces well-formed AST for a list of input objects', () => {
    const d = doc('{ search }');
    const result = setListArgValue(d, ['search'], 'filters', [
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ]);
    const printed = print(result);
    // Both objects must appear
    expect(printed).toMatch(/name: "a"/);
    expect(printed).toMatch(/name: "b"/);
    // Must be parseable
    const reparsed = parse(printed);
    expect(reparsed.definitions).toHaveLength(1);
  });

  it('handles a list with a single input object', () => {
    const d = doc('{ createTags }');
    const result = setListArgValue(d, ['createTags'], 'tags', [{ name: 'solo' }]);
    const printed = print(result);
    expect(printed).toMatch(/name: "solo"/);
    expect(() => parse(printed)).not.toThrow();
  });
});
