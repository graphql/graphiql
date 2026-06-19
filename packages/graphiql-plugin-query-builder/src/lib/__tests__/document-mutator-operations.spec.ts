import { Kind, parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  getFieldArgValues,
  isFieldSelected,
  setFieldArgument,
  toggleFieldSelection,
} from '../document-mutator';

/**
 * A document with two named operations:
 *   query A  { hero { id } }
 *   mutation B { createHero(name: "Luke") { id } }
 */
function twoOpDoc() {
  return parse(
    `query A { hero { id } } mutation B { createHero(name: "Luke") { id } }`,
    { noLocation: true },
  );
}

describe('toggleFieldSelection — named operation targeting', () => {
  it('adds a field to operation B and leaves A untouched', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(d, ['createHero', 'name'], 'B');
    const printed = print(result);

    // B should now have `name` inside createHero
    expect(printed).toContain('name');
    // A should still only contain hero { id } — no createHero
    const queryADef = result.definitions.find(
      def => def.kind === 'OperationDefinition' && def.name?.value === 'A',
    );
    expect(queryADef).toBeDefined();
    if (queryADef?.kind === 'OperationDefinition') {
      const heroField = queryADef.selectionSet.selections.find(
        s => s.kind === 'Field' && s.name.value === 'hero',
      );
      expect(heroField).toBeDefined();
      // A should NOT have createHero
      const createHeroField = queryADef.selectionSet.selections.find(
        s => s.kind === 'Field' && s.name.value === 'createHero',
      );
      expect(createHeroField).toBeUndefined();
    }
  });

  it('adds a field to operation A and leaves B untouched', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(d, ['hero', 'name'], 'A');
    const printed = print(result);

    expect(printed).toContain('name');
    // B should still only have createHero { id }
    const mutBDef = result.definitions.find(
      def => def.kind === 'OperationDefinition' && def.name?.value === 'B',
    );
    if (mutBDef?.kind === 'OperationDefinition') {
      const heroField = mutBDef.selectionSet.selections.find(
        s => s.kind === 'Field' && s.name.value === 'hero',
      );
      expect(heroField).toBeUndefined();
    }
  });
});

describe('isFieldSelected — per operation name', () => {
  it('returns true for a field in A when targeting A', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, ['hero'], 'A')).toBe(true);
  });

  it('returns false for a field in A when targeting B', () => {
    const d = twoOpDoc();
    // hero is in A, not in B
    expect(isFieldSelected(d, ['hero'], 'B')).toBe(false);
  });

  it('returns true for a field in B when targeting B', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, ['createHero'], 'B')).toBe(true);
  });

  it('returns false for a field in B when targeting A', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, ['createHero'], 'A')).toBe(false);
  });
});

describe('getFieldArgValues / setFieldArgument — named operation', () => {
  it('reads arg values from the correct operation', () => {
    const d = twoOpDoc();
    // B has createHero(name: "Luke")
    const values = getFieldArgValues(d, ['createHero'], 'B');
    expect(values['name']).toBe('Luke');
  });

  it('returns empty when path resolves in a different operation', () => {
    const d = twoOpDoc();
    // createHero is in B, not A
    const values = getFieldArgValues(d, ['createHero'], 'A');
    expect(Object.keys(values)).toHaveLength(0);
  });

  it('sets an argument on the named operation only', () => {
    const d = twoOpDoc();
    const valueNode = { kind: Kind.STRING, value: 'Leia' } as const;
    const result = setFieldArgument(d, ['createHero'], 'name', valueNode, 'B');

    // B should have the updated arg
    const valuesB = getFieldArgValues(result, ['createHero'], 'B');
    expect(valuesB['name']).toBe('Leia');

    // A should be completely unchanged (hero { id } has no args)
    const valuesA = getFieldArgValues(result, ['hero'], 'A');
    expect(Object.keys(valuesA)).toHaveLength(0);
  });
});

describe('backward-compatibility — no operationName falls back to first operation', () => {
  it('isFieldSelected without operationName targets the first operation', () => {
    const d = twoOpDoc();
    // First op is A which has `hero`
    expect(isFieldSelected(d, ['hero'])).toBe(true);
    expect(isFieldSelected(d, ['createHero'])).toBe(false);
  });

  it('toggleFieldSelection without operationName modifies the first operation', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(d, ['hero', 'name']);
    // hero.name added to first op (A)
    expect(isFieldSelected(result, ['hero', 'name'], 'A')).toBe(true);
    // B should be untouched
    expect(isFieldSelected(result, ['createHero'], 'B')).toBe(true);
    expect(isFieldSelected(result, ['hero'], 'B')).toBe(false);
  });

  it('getFieldArgValues without operationName reads from the first operation', () => {
    // Build a doc where the first op has args
    const d = parse(`query A { hero(id: "1") { name } } mutation B { noop }`, {
      noLocation: true,
    });
    const values = getFieldArgValues(d, ['hero']);
    expect(values['id']).toBe('1');
  });
});

describe('fallback when operationName does not match any operation', () => {
  it('isFieldSelected falls back to first operation on unknown name', () => {
    const d = twoOpDoc();
    // 'hero' is in A (the first op); unknown name should fall back to A
    expect(isFieldSelected(d, ['hero'], 'NonExistent')).toBe(true);
  });

  it('toggleFieldSelection falls back to first operation on unknown name', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(d, ['hero', 'name'], 'NoMatch');
    // hero.name should be added to A (the first op) because NoMatch doesn't exist
    expect(isFieldSelected(result, ['hero', 'name'], 'A')).toBe(true);
    // B should be untouched
    expect(isFieldSelected(result, ['createHero'], 'B')).toBe(true);
  });

  it('getFieldArgValues falls back to first operation on unknown name', () => {
    const d = parse(`query A { hero(id: "1") { name } } mutation B { noop }`, {
      noLocation: true,
    });
    const values = getFieldArgValues(d, ['hero'], 'NoMatch');
    expect(values['id']).toBe('1');
  });
});
