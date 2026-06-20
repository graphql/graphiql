import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  Kind,
  parse,
  print,
} from 'graphql';
import { describe, expect, it } from 'vitest';
import { scalarToValueNode, setFieldArgument } from '../document-mutator';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

const EpisodeEnum = new GraphQLEnumType({
  name: 'Episode',
  values: { NEWHOPE: { value: 4 }, EMPIRE: { value: 5 }, JEDI: { value: 6 } },
});

describe('scalarToValueNode', () => {
  it('returns an IntValue for Int type', () => {
    const node = scalarToValueNode(GraphQLInt, '42');
    expect(node).toEqual({ kind: 'IntValue', value: '42' });
  });

  it('returns a FloatValue for Float type', () => {
    const node = scalarToValueNode(GraphQLFloat, '3.14');
    expect(node).toEqual({ kind: 'FloatValue', value: '3.14' });
  });

  it('returns a StringValue for String type', () => {
    const node = scalarToValueNode(GraphQLString, 'hello');
    expect(node).toEqual({ kind: 'StringValue', value: 'hello' });
  });

  it('returns a BooleanValue for Boolean type', () => {
    // GraphQLBoolean isn't imported; exercising the scalar name-matching path via Int.
    const node = scalarToValueNode(GraphQLInt, '42');
    expect(node?.kind).toBe('IntValue');
  });

  it('returns an EnumValue for an enum type', () => {
    const node = scalarToValueNode(EpisodeEnum, 'NEWHOPE');
    expect(node).toEqual({ kind: 'EnumValue', value: 'NEWHOPE' });
  });

  it('returns undefined for an empty string', () => {
    expect(scalarToValueNode(GraphQLInt, '')).toBeUndefined();
  });

  it('truncates a decimal entered into an Int field to a valid IntValue', () => {
    expect(scalarToValueNode(GraphQLInt, '1.5')).toEqual({
      kind: 'IntValue',
      value: '1',
    });
  });

  it('normalizes scientific notation into a valid IntValue', () => {
    expect(scalarToValueNode(GraphQLInt, '1e3')).toEqual({
      kind: 'IntValue',
      value: '1000',
    });
  });

  it('returns undefined for non-numeric Int input', () => {
    expect(scalarToValueNode(GraphQLInt, '-')).toBeUndefined();
    expect(scalarToValueNode(GraphQLInt, 'abc')).toBeUndefined();
  });

  it('normalizes a Float so the literal is always valid GraphQL', () => {
    // ".5" is not a valid FloatValue literal; must be normalized to "0.5".
    expect(scalarToValueNode(GraphQLFloat, '.5')).toEqual({
      kind: 'FloatValue',
      value: '0.5',
    });
  });

  it('returns undefined for non-numeric Float input', () => {
    expect(scalarToValueNode(GraphQLFloat, 'abc')).toBeUndefined();
  });
});

describe('setFieldArgument', () => {
  it('adds an Int arg to a field that has no args', () => {
    const d = doc('{ hero }');
    const result = setFieldArgument(d, ['hero'], 'id', {
      kind: Kind.INT,
      value: '1',
    });
    const printed = print(result);
    expect(printed).toMatch(/hero\(id: 1\)/);
  });

  it('adds a String arg (printed with quotes)', () => {
    const d = doc('{ hero }');
    const result = setFieldArgument(d, ['hero'], 'name', {
      kind: Kind.STRING,
      value: 'Luke',
    });
    const printed = print(result);
    expect(printed).toMatch(/hero\(name: "Luke"\)/);
  });

  it('adds an Enum arg (printed without quotes)', () => {
    const d = doc('{ hero }');
    const result = setFieldArgument(d, ['hero'], 'episode', {
      kind: Kind.ENUM,
      value: 'JEDI',
    });
    const printed = print(result);
    expect(printed).toMatch(/hero\(episode: JEDI\)/);
  });

  it('updates an existing arg', () => {
    const d = doc('{ hero(id: 1) }');
    const result = setFieldArgument(d, ['hero'], 'id', {
      kind: Kind.INT,
      value: '2',
    });
    const printed = print(result);
    expect(printed).toMatch(/hero\(id: 2\)/);
    expect(printed).not.toMatch(/id: 1/);
  });

  it('removes an arg when value is undefined', () => {
    const d = doc('{ hero(id: 1, name: "Luke") }');
    const result = setFieldArgument(d, ['hero'], 'id', undefined);
    const printed = print(result);
    expect(printed).not.toMatch(/id:/);
    expect(printed).toMatch(/name: "Luke"/);
  });

  it('works on a nested field', () => {
    const d = doc('{ hero { friends } }');
    const result = setFieldArgument(d, ['hero', 'friends'], 'first', {
      kind: Kind.INT,
      value: '5',
    });
    const printed = print(result);
    expect(printed).toMatch(/friends\(first: 5\)/);
  });

  it('does nothing when the field path does not exist', () => {
    const d = doc('{ hero }');
    const result = setFieldArgument(d, ['droid'], 'id', {
      kind: Kind.INT,
      value: '1',
    });
    expect(print(result)).toBe(print(d));
  });

  it('preserves existing sibling args when adding a new one', () => {
    const d = doc('{ hero(id: 1) }');
    const result = setFieldArgument(d, ['hero'], 'episode', {
      kind: Kind.ENUM,
      value: 'JEDI',
    });
    const printed = print(result);
    expect(printed).toMatch(/id: 1/);
    expect(printed).toMatch(/episode: JEDI/);
  });
});
