import { Kind, parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  fieldSegment,
  isFieldSelected,
  toggleFieldSelection,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

describe('isFieldSelected', () => {
  it('returns false when the field is absent', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, [fieldSegment('droid')])).toBe(false);
  });

  it('returns true for a top-level field that is selected', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, [fieldSegment('hero')])).toBe(true);
  });

  it('returns false for a top-level field that is not selected', () => {
    const d = doc('{ hero }');
    expect(isFieldSelected(d, [fieldSegment('droid')])).toBe(false);
  });

  it('returns true for a nested field that is selected', () => {
    const d = doc('{ hero { name } }');
    expect(
      isFieldSelected(d, [fieldSegment('hero'), fieldSegment('name')]),
    ).toBe(true);
  });

  it('returns false for a nested field when parent has no selection set', () => {
    const d = doc('{ hero }');
    expect(
      isFieldSelected(d, [fieldSegment('hero'), fieldSegment('name')]),
    ).toBe(false);
  });

  it('returns false for a deeply nested missing field', () => {
    const d = doc('{ hero { friends { name } } }');
    expect(
      isFieldSelected(d, [
        fieldSegment('hero'),
        fieldSegment('friends'),
        fieldSegment('appearsIn'),
      ]),
    ).toBe(false);
  });

  it('returns true for a deeply nested field that is selected', () => {
    const d = doc('{ hero { friends { name } } }');
    expect(
      isFieldSelected(d, [
        fieldSegment('hero'),
        fieldSegment('friends'),
        fieldSegment('name'),
      ]),
    ).toBe(true);
  });
});

describe('toggleFieldSelection — adding fields', () => {
  it('adds a top-level field', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [fieldSegment('droid')]);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(true);
  });

  it('adds a second top-level field', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [fieldSegment('droid')]);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(true);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
  });

  it('adds a nested field and creates the parent selection set', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('name')]),
    ).toBe(true);
  });

  it('adds a deeply nested field, creating intermediate selection sets', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('friends'),
      fieldSegment('name'),
    ]);
    expect(
      isFieldSelected(result, [
        fieldSegment('hero'),
        fieldSegment('friends'),
        fieldSegment('name'),
      ]),
    ).toBe(true);
  });

  it('adds a new top-level field that is not yet in the doc', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [fieldSegment('droid')]);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
  });

  it('preserves existing siblings when adding a new nested field', () => {
    const d = doc('{ hero { id } }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('id')]),
    ).toBe(true);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('name')]),
    ).toBe(true);
  });
});

describe('toggleFieldSelection — removing fields', () => {
  it('removes a top-level field', () => {
    const d = doc('{ hero droid }');
    const result = toggleFieldSelection(d, [fieldSegment('hero')]);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(false);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
  });

  it('removes a nested field', () => {
    const d = doc('{ hero { id name } }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('name')]),
    ).toBe(false);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('id')]),
    ).toBe(true);
  });

  it('removes a parent field along with its children', () => {
    const d = doc('{ hero { id name } droid }');
    const result = toggleFieldSelection(d, [fieldSegment('hero')]);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(false);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('id')]),
    ).toBe(false);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
  });

  it('adding a field that was just removed restores it', () => {
    const d = doc('{ hero droid }');
    const without = toggleFieldSelection(d, [fieldSegment('hero')]);
    const restored = toggleFieldSelection(without, [fieldSegment('hero')]);
    expect(isFieldSelected(restored, [fieldSegment('hero')])).toBe(true);
    expect(isFieldSelected(restored, [fieldSegment('droid')])).toBe(true);
  });

  it('prunes a parent emptied by removing its last child', () => {
    const d = doc('{ hero { name } droid }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(false);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
    expect(print(result)).toMatchInlineSnapshot(`
      "{
        droid
      }"
    `);
  });

  it('keeps a parent that still has other children after removal', () => {
    const d = doc('{ hero { id name } }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(true);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('id')]),
    ).toBe(true);
  });

  it('cascades pruning up through multiple now-empty ancestors', () => {
    const d = doc('{ hero { friends { name } } droid }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('friends'),
      fieldSegment('name'),
    ]);
    expect(isFieldSelected(result, [fieldSegment('hero')])).toBe(false);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('friends')]),
    ).toBe(false);
    expect(isFieldSelected(result, [fieldSegment('droid')])).toBe(true);
  });

  it('drops an operation emptied of its last field, keeping the rest valid', () => {
    const d = doc('query A { hero } mutation B { createHero { id } }');
    const result = toggleFieldSelection(d, [fieldSegment('hero')], 'A');
    // An operation with no body is unprintable; it must be dropped entirely.
    expect(
      result.definitions.some(
        def =>
          def.kind === Kind.OPERATION_DEFINITION && def.name?.value === 'A',
      ),
    ).toBe(false);
    expect(() => print(result)).not.toThrow();
    expect(print(result)).toMatchInlineSnapshot(`
      "mutation B {
        createHero {
          id
        }
      }"
    `);
  });

  it('drops the sole operation when its last field is removed', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [fieldSegment('hero')]);
    expect(result.definitions).toHaveLength(0);
  });

  it('removes only the first occurrence when a field name is aliased twice', () => {
    // Both `a: hero` and `b: hero` match the `hero` segment by schema name;
    // removing must drop only one occurrence to preserve hand-written aliases.
    const d = doc('{ a: hero b: hero }');
    const result = toggleFieldSelection(d, [fieldSegment('hero')]);
    expect(print(result)).toMatchInlineSnapshot(`
      "{
        b: hero
      }"
    `);
  });
});

describe('toggleFieldSelection — round-trip', () => {
  it('produces valid GraphQL when adding a nested field', () => {
    const d = doc('{ hero }');
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
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
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
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
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(
      isFieldSelected(result, [fieldSegment('hero'), fieldSegment('name')]),
    ).toBe(true);
  });
});
