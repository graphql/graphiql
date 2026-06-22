import { Kind, parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  fieldSegment,
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
    const result = toggleFieldSelection(
      d,
      [fieldSegment('createHero'), fieldSegment('name')],
      'B',
    );
    const printed = print(result);

    expect(printed).toContain('name');
    const queryADef = result.definitions.find(
      def => def.kind === Kind.OPERATION_DEFINITION && def.name?.value === 'A',
    );
    expect(queryADef).toBeDefined();
    if (queryADef?.kind === Kind.OPERATION_DEFINITION) {
      const heroField = queryADef.selectionSet.selections.find(
        s => s.kind === Kind.FIELD && s.name.value === 'hero',
      );
      expect(heroField).toBeDefined();
      const createHeroField = queryADef.selectionSet.selections.find(
        s => s.kind === Kind.FIELD && s.name.value === 'createHero',
      );
      expect(createHeroField).toBeUndefined();
    }
  });

  it('adds a field to operation A and leaves B untouched', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(
      d,
      [fieldSegment('hero'), fieldSegment('name')],
      'A',
    );
    const printed = print(result);

    expect(printed).toContain('name');
    const mutBDef = result.definitions.find(
      def => def.kind === Kind.OPERATION_DEFINITION && def.name?.value === 'B',
    );
    if (mutBDef?.kind === Kind.OPERATION_DEFINITION) {
      const heroField = mutBDef.selectionSet.selections.find(
        s => s.kind === Kind.FIELD && s.name.value === 'hero',
      );
      expect(heroField).toBeUndefined();
    }
  });
});

describe('isFieldSelected — per operation name', () => {
  it('returns true for a field in A when targeting A', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, [fieldSegment('hero')], 'A')).toBe(true);
  });

  it('returns false for a field in A when targeting B', () => {
    const d = twoOpDoc();
    // hero is in A, not in B
    expect(isFieldSelected(d, [fieldSegment('hero')], 'B')).toBe(false);
  });

  it('returns true for a field in B when targeting B', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, [fieldSegment('createHero')], 'B')).toBe(true);
  });

  it('returns false for a field in B when targeting A', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, [fieldSegment('createHero')], 'A')).toBe(false);
  });
});

describe('getFieldArgValues / setFieldArgument — named operation', () => {
  it('reads arg values from the correct operation', () => {
    const d = twoOpDoc();
    const values = getFieldArgValues(d, [fieldSegment('createHero')], 'B');
    expect(values['name']).toBe('Luke');
  });

  it('returns empty when path resolves in a different operation', () => {
    const d = twoOpDoc();
    const values = getFieldArgValues(d, [fieldSegment('createHero')], 'A');
    expect(Object.keys(values)).toHaveLength(0);
  });

  it('sets an argument on the named operation only', () => {
    const d = twoOpDoc();
    const valueNode = { kind: Kind.STRING, value: 'Leia' } as const;
    const result = setFieldArgument(
      d,
      [fieldSegment('createHero')],
      'name',
      valueNode,
      'B',
    );

    const valuesB = getFieldArgValues(
      result,
      [fieldSegment('createHero')],
      'B',
    );
    expect(valuesB['name']).toBe('Leia');

    const valuesA = getFieldArgValues(result, [fieldSegment('hero')], 'A');
    expect(Object.keys(valuesA)).toHaveLength(0);
  });
});

describe('backward-compatibility — no operationName falls back to first operation', () => {
  it('isFieldSelected without operationName targets the first operation', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, [fieldSegment('hero')])).toBe(true);
    expect(isFieldSelected(d, [fieldSegment('createHero')])).toBe(false);
  });

  it('toggleFieldSelection without operationName modifies the first operation', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(d, [
      fieldSegment('hero'),
      fieldSegment('name'),
    ]);
    expect(
      isFieldSelected(
        result,
        [fieldSegment('hero'), fieldSegment('name')],
        'A',
      ),
    ).toBe(true);
    expect(isFieldSelected(result, [fieldSegment('createHero')], 'B')).toBe(
      true,
    );
    expect(isFieldSelected(result, [fieldSegment('hero')], 'B')).toBe(false);
  });

  it('getFieldArgValues without operationName reads from the first operation', () => {
    // Build a doc where the first op has args
    const d = parse(`query A { hero(id: "1") { name } } mutation B { noop }`, {
      noLocation: true,
    });
    const values = getFieldArgValues(d, [fieldSegment('hero')]);
    expect(values['id']).toBe('1');
  });
});

describe('fallback when operationName does not match any operation', () => {
  it('isFieldSelected falls back to first operation on unknown name', () => {
    const d = twoOpDoc();
    expect(isFieldSelected(d, [fieldSegment('hero')], 'NonExistent')).toBe(
      true,
    );
  });

  it('toggleFieldSelection falls back to first operation on unknown name', () => {
    const d = twoOpDoc();
    const result = toggleFieldSelection(
      d,
      [fieldSegment('hero'), fieldSegment('name')],
      'NoMatch',
    );
    expect(
      isFieldSelected(
        result,
        [fieldSegment('hero'), fieldSegment('name')],
        'A',
      ),
    ).toBe(true);
    expect(isFieldSelected(result, [fieldSegment('createHero')], 'B')).toBe(
      true,
    );
  });

  it('getFieldArgValues falls back to first operation on unknown name', () => {
    const d = parse(`query A { hero(id: "1") { name } } mutation B { noop }`, {
      noLocation: true,
    });
    const values = getFieldArgValues(d, [fieldSegment('hero')], 'NoMatch');
    expect(values['id']).toBe('1');
  });
});
