import { Kind, parse, print } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  promoteArgToVariable,
  demoteVariable,
  suggestVarName,
  createFragmentFromSelection,
  listFragments,
  toggleFieldSelection,
} from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

// ---------------------------------------------------------------------------
// suggestVarName
// ---------------------------------------------------------------------------

describe('suggestVarName', () => {
  it('returns the arg name when no collision exists', () => {
    const d = doc('query { hero }');
    expect(suggestVarName(d, 'id')).toBe('id');
  });

  it('appends _2 when the name already exists', () => {
    const d = doc('query ($id: String) { hero }');
    expect(suggestVarName(d, 'id')).toBe('id_2');
  });

  it('appends _3 when _2 also exists', () => {
    const d = doc('query ($id: String, $id_2: String) { hero }');
    expect(suggestVarName(d, 'id')).toBe('id_3');
  });

  it('returns the arg name when the operation has no variable definitions', () => {
    const d = doc('{ hero }');
    expect(suggestVarName(d, 'first')).toBe('first');
  });

  it('avoids names used in OTHER operations (shared variables JSON)', () => {
    // A `$value` already exists in operation A; promoting in B must not reuse
    // it, since both operations share one variables JSON object.
    const d = doc(
      'query A($value: String) { hero } mutation B { setString(value: "x") }',
    );
    expect(suggestVarName(d, 'value')).toBe('value_2');
  });
});

// ---------------------------------------------------------------------------
// promoteArgToVariable
// ---------------------------------------------------------------------------

describe('promoteArgToVariable', () => {
  it('adds a variable definition to the operation', () => {
    const d = doc('query { hero(id: "1") }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    const printed = print(result);
    expect(printed).toMatch(/\$id: String/);
  });

  it('replaces the inline arg value with the variable reference', () => {
    const d = doc('query { hero(id: "1") }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    const printed = print(result);
    expect(printed).toMatch(/hero\(id: \$id\)/);
    expect(printed).not.toMatch(/id: "1"/);
  });

  it('includes the default value in the variable definition', () => {
    const d = doc('query { hero(first: 5) }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'first',
      'first',
      'Int',
      '5',
    );
    const printed = print(result);
    expect(printed).toMatch(/\$first: Int = 5/);
  });

  it('promotes an Int arg', () => {
    const d = doc('query { items(limit: 10) }');
    const result = promoteArgToVariable(
      d,
      ['items'],
      'limit',
      'limit',
      'Int',
      '10',
    );
    const printed = print(result);
    expect(printed).toMatch(/\$limit: Int = 10/);
    expect(printed).toMatch(/items\(limit: \$limit\)/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('promotes a Boolean arg', () => {
    const d = doc('query { users(active: true) }');
    const result = promoteArgToVariable(
      d,
      ['users'],
      'active',
      'active',
      'Boolean',
      'true',
    );
    const printed = print(result);
    expect(printed).toMatch(/\$active: Boolean/);
    expect(printed).toMatch(/users\(active: \$active\)/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('promotes a String arg without a default value', () => {
    const d = doc('query { search(query: "hello") }');
    const result = promoteArgToVariable(
      d,
      ['search'],
      'query',
      'query',
      'String',
      '',
    );
    const printed = print(result);
    expect(printed).toMatch(/\$query: String/);
    expect(printed).toMatch(/search\(query: \$query\)/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('preserves other args on the same field', () => {
    const d = doc('query { hero(id: "1", episode: JEDI) }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    const printed = print(result);
    expect(printed).toMatch(/episode: JEDI/);
    expect(printed).toMatch(/\$id: String/);
  });

  it('works on a nested field', () => {
    const d = doc('query { hero { friends(first: 3) { name } } }');
    const result = promoteArgToVariable(
      d,
      ['hero', 'friends'],
      'first',
      'first',
      'Int',
      '3',
    );
    const printed = print(result);
    expect(printed).toMatch(/\$first: Int = 3/);
    expect(printed).toMatch(/friends\(first: \$first\)/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('adds an anonymous operation name when the operation is unnamed', () => {
    const d = doc('{ hero(id: "1") }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    const printed = print(result);
    // Should be parseable and contain the variable definition
    expect(() => parse(printed)).not.toThrow();
    expect(printed).toMatch(/\$id: String/);
    expect(printed).toMatch(/hero\(id: \$id\)/);
  });

  it('produces a parseable document', () => {
    const d = doc('query GetHero { hero(id: "1") }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    expect(() => parse(print(result))).not.toThrow();
  });

  it('is a no-op when the arg path does not resolve (no dangling variable)', () => {
    const d = doc('query { hero(id: "1") }');
    const result = promoteArgToVariable(
      d,
      ['villain'], // no such field
      'id',
      'id',
      'String',
      '"1"',
    );
    // Nothing references the variable, so none should be defined.
    expect(print(result)).not.toMatch(/\$id/);
    expect(result).toBe(d);
  });

  it('does not define the same variable twice when promoted repeatedly', () => {
    const d = doc('query ($id: String) { hero(id: $id) }');
    const result = promoteArgToVariable(
      d,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    const printed = print(result);
    // Exactly one `$id: String` definition, and it stays valid.
    expect(printed.match(/\$id: String/g)).toHaveLength(1);
    expect(() => parse(printed)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// demoteVariable
// ---------------------------------------------------------------------------

describe('demoteVariable', () => {
  it('removes the variable definition from the operation', () => {
    const d = doc('query ($id: String = "1") { hero(id: $id) }');
    const result = demoteVariable(d, 'id');
    const printed = print(result);
    expect(printed).not.toMatch(/\$id: String/);
  });

  it('restores the default value as an inline literal', () => {
    const d = doc('query ($id: String = "1") { hero(id: $id) }');
    const result = demoteVariable(d, 'id');
    const printed = print(result);
    expect(printed).toMatch(/hero\(id: "1"\)/);
  });

  it('restores an Int default value', () => {
    const d = doc('query ($first: Int = 5) { items(limit: $first) }');
    const result = demoteVariable(d, 'first');
    const printed = print(result);
    expect(printed).toMatch(/items\(limit: 5\)/);
    expect(printed).not.toMatch(/\$first/);
  });

  it('removes the arg entirely when there is no default value', () => {
    const d = doc('query ($query: String) { search(query: $query) }');
    const result = demoteVariable(d, 'query');
    const printed = print(result);
    expect(printed).not.toMatch(/query:/);
    expect(printed).not.toMatch(/\$query/);
  });

  it('does nothing when the variable name does not exist', () => {
    const d = doc('query ($id: String = "1") { hero(id: $id) }');
    const result = demoteVariable(d, 'nonexistent');
    expect(print(result)).toBe(print(d));
  });

  it('produces a parseable document', () => {
    const d = doc('query ($id: String = "1") { hero(id: $id) }');
    const result = demoteVariable(d, 'id');
    expect(() => parse(print(result))).not.toThrow();
  });

  it('preserves other variable definitions', () => {
    const d = doc(
      'query ($id: String = "1", $episode: Episode = JEDI) { hero(id: $id, episode: $episode) }',
    );
    const result = demoteVariable(d, 'id');
    const printed = print(result);
    expect(printed).toMatch(/\$episode: Episode/);
    expect(printed).not.toMatch(/\$id:/);
  });

  it('round-trips: promote then demote restores the original arg value', () => {
    const original = doc('query GetHero { hero(id: "1") }');
    const promoted = promoteArgToVariable(
      original,
      ['hero'],
      'id',
      'id',
      'String',
      '"1"',
    );
    const demoted = demoteVariable(promoted, 'id');
    const printed = print(demoted);
    expect(printed).toMatch(/hero\(id: "1"\)/);
    expect(printed).not.toMatch(/\$id/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('uses the passed inlineValue instead of the stored default when demoting', () => {
    // Document has no default on the variable definition (as produced by the
    // new promote flow which passes empty string for the default).
    const d = doc('query A($v: String) { f(a: $v) }');
    const inlineValue = { kind: Kind.STRING as const, value: 'hello' };
    const result = demoteVariable(d, 'v', undefined, inlineValue);
    const printed = print(result);
    expect(printed).toMatch(/f\(a: "hello"\)/);
    expect(printed).not.toMatch(/\$v/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('inlineValue takes precedence over the stored default', () => {
    // Variable definition has a default of "stored"; passed inlineValue should win.
    const d = doc('query A($v: String = "stored") { f(a: $v) }');
    const inlineValue = { kind: Kind.STRING as const, value: 'override' };
    const result = demoteVariable(d, 'v', undefined, inlineValue);
    const printed = print(result);
    expect(printed).toMatch(/f\(a: "override"\)/);
    expect(printed).not.toMatch(/stored/);
    expect(printed).not.toMatch(/\$v/);
  });
});

// ---------------------------------------------------------------------------
// listFragments
// ---------------------------------------------------------------------------

describe('listFragments', () => {
  it('returns an empty array when the document has no fragment definitions', () => {
    const d = doc('{ hero { name } }');
    expect(listFragments(d)).toEqual([]);
  });

  it('returns the name of a single fragment', () => {
    const d = doc(
      '{ hero { ...HeroFields } } fragment HeroFields on Hero { name }',
    );
    expect(listFragments(d)).toEqual(['HeroFields']);
  });

  it('returns multiple fragment names in document order', () => {
    const d = doc(`
      { hero { ...HeroFields } droid { ...DroidFields } }
      fragment HeroFields on Hero { name }
      fragment DroidFields on Droid { primaryFunction }
    `);
    expect(listFragments(d)).toEqual(['HeroFields', 'DroidFields']);
  });
});

// ---------------------------------------------------------------------------
// createFragmentFromSelection
// ---------------------------------------------------------------------------

describe('createFragmentFromSelection', () => {
  it('creates a named fragment definition for the selected fields', () => {
    const d = doc('{ hero { name appearsIn } }');
    const result = createFragmentFromSelection(
      d,
      ['hero'],
      'HeroDetails',
      'Hero',
    );
    const printed = print(result);
    expect(printed).toMatch(/fragment HeroDetails on Hero/);
    expect(printed).toMatch(/name/);
    expect(printed).toMatch(/appearsIn/);
    expect(() => parse(printed)).not.toThrow();
  });

  it('adds a spread to the field in the operation', () => {
    const d = doc('{ hero { name appearsIn } }');
    const result = createFragmentFromSelection(
      d,
      ['hero'],
      'HeroDetails',
      'Hero',
    );
    const printed = print(result);
    expect(printed).toMatch(/\.\.\.HeroDetails/);
  });

  it('removes the inlined fields from the selection set and replaces with the spread', () => {
    const d = doc('{ hero { name appearsIn } }');
    const result = createFragmentFromSelection(
      d,
      ['hero'],
      'HeroDetails',
      'Hero',
    );
    const defs = result.definitions;
    // Should have 2 definitions: operation + fragment
    expect(defs).toHaveLength(2);
    const fragDef = defs.find(def => def.kind === 'FragmentDefinition');
    expect(fragDef).toBeDefined();
  });

  it('does nothing when the path does not exist in the document', () => {
    const d = doc('{ hero { name } }');
    const result = createFragmentFromSelection(
      d,
      ['droid'],
      'DroidFields',
      'Droid',
    );
    expect(print(result)).toBe(print(d));
  });

  it('produces a parseable document', () => {
    const d = doc('{ hero { id name friends { name } } }');
    const result = createFragmentFromSelection(d, ['hero'], 'HeroFull', 'Hero');
    expect(() => parse(print(result))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// toggleFieldSelection — variable cleanup
// ---------------------------------------------------------------------------

describe('toggleFieldSelection — unused variable cleanup', () => {
  it('drops a variable definition orphaned by removing its field', () => {
    const d = doc('query A($x: String) { hero(id: $x) { name } droid }');
    const result = toggleFieldSelection(d, ['hero']);
    expect(print(result)).not.toContain('$x');
    expect(print(result)).toContain('droid');
  });

  it('keeps a variable still referenced by another field', () => {
    const d = doc('query A($x: String) { hero(id: $x) other(id: $x) }');
    const result = toggleFieldSelection(d, ['hero']);
    expect(print(result)).toContain('$x');
    expect(print(result)).toContain('other(id: $x)');
  });

  it('keeps a variable referenced only through a fragment spread', () => {
    const d = doc(
      'query A($x: String) { hero { ...F } } fragment F on Hero { friend(id: $x) }',
    );
    const result = toggleFieldSelection(d, ['hero', 'name']);
    expect(print(result)).toContain('$x');
  });
});
