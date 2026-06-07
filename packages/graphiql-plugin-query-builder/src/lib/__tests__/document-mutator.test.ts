import { parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import { isFieldSelected, toggleFieldSelection } from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

describe('isFieldSelected', () => {
  it('returns false when the field is absent', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, ['droid'])).toBe(false);
  });

  it('returns true for a top-level field that is selected', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, ['hero'])).toBe(true);
  });

  it('returns false for a top-level field that is not selected', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, ['droid'])).toBe(false);
  });

  it('returns true for a nested field that is selected', () => {
    const d = doc('{ hero { name } }');
    expect(isFieldSelected(d, ['hero', 'name'])).toBe(true);
  });

  it('returns false for a nested field when parent has no selection set', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, ['hero', 'name'])).toBe(false);
  });

  it('returns false for a deeply nested missing field', () => {
    const d = doc('{ hero { friends { name } } }');
    expect(isFieldSelected(d, ['hero', 'friends', 'appearsIn'])).toBe(false);
  });

  it('returns true for a deeply nested field that is selected', () => {
    const d = doc('{ hero { friends { name } } }');
    expect(isFieldSelected(d, ['hero', 'friends', 'name'])).toBe(true);
  });
});

describe('toggleFieldSelection — adding fields', () => {
  it('adds a top-level field', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, ['droid']);
    expect(isFieldSelected(result, ['droid'])).toBe(true);
    expect(isFieldSelected(result, ['hero'])).toBe(true);
  });

  it('adds a second top-level field', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, ['droid']);
    expect(isFieldSelected(result, ['hero'])).toBe(true);
    expect(isFieldSelected(result, ['droid'])).toBe(true);
  });

  it('adds a nested field and creates the parent selection set', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, ['hero', 'name']);
    expect(isFieldSelected(result, ['hero', 'name'])).toBe(true);
  });

  it('adds a deeply nested field, creating intermediate selection sets', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, ['hero', 'friends', 'name']);
    expect(isFieldSelected(result, ['hero', 'friends', 'name'])).toBe(true);
  });

  it('adds a new top-level field that is not yet in the doc', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, ['droid']);
    expect(isFieldSelected(result, ['droid'])).toBe(true);
  });

  it('preserves existing siblings when adding a new nested field', () => {
    const d = doc('{ hero { id } }');
    const result = toggleFieldSelection(d, ['hero', 'name']);
    expect(isFieldSelected(result, ['hero', 'id'])).toBe(true);
    expect(isFieldSelected(result, ['hero', 'name'])).toBe(true);
  });
});

describe('toggleFieldSelection — removing fields', () => {
  it('removes a top-level field', () => {
    const d = doc('{ hero droid }');
    const result = toggleFieldSelection(d, ['hero']);
    expect(isFieldSelected(result, ['hero'])).toBe(false);
    expect(isFieldSelected(result, ['droid'])).toBe(true);
  });

  it('removes a nested field', () => {
    const d = doc('{ hero { id name } }');
    const result = toggleFieldSelection(d, ['hero', 'name']);
    expect(isFieldSelected(result, ['hero', 'name'])).toBe(false);
    expect(isFieldSelected(result, ['hero', 'id'])).toBe(true);
  });

  it('removes a parent field along with its children', () => {
    const d = doc('{ hero { id name } droid }');
    const result = toggleFieldSelection(d, ['hero']);
    expect(isFieldSelected(result, ['hero'])).toBe(false);
    expect(isFieldSelected(result, ['hero', 'id'])).toBe(false);
    expect(isFieldSelected(result, ['droid'])).toBe(true);
  });

  it('adding a field that was just removed restores it', () => {
    const d = doc('{ hero droid }');
    const without = toggleFieldSelection(d, ['hero']);
    const restored = toggleFieldSelection(without, ['hero']);
    expect(isFieldSelected(restored, ['hero'])).toBe(true);
    expect(isFieldSelected(restored, ['droid'])).toBe(true);
  });
});

describe('toggleFieldSelection — round-trip', () => {
  it('produces valid GraphQL when adding a nested field', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, ['hero', 'name']);
    expect(() => print(result)).not.toThrow();
    expect(print(result)).toMatchInlineSnapshot(`
      "{
        hero {
          name
        }
      }"
    `);
  });

  it('produces valid GraphQL when removing a nested field', () => {
    const d = doc('{ hero { id name } }');
    const result = toggleFieldSelection(d, ['hero', 'name']);
    expect(print(result)).toMatchInlineSnapshot(`
      "{
        hero {
          id
        }
      }"
    `);
  });

  it('handles multiple operations — only the first is modified', () => {
    const d = doc('query A { hero } mutation B { createHero { id } }');
    const result = toggleFieldSelection(d, ['hero', 'name']);
    // 'hero' in first op gets name added
    expect(isFieldSelected(result, ['hero', 'name'])).toBe(true);
  });
});
