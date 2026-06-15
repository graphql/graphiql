import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  Kind,
  parse,
  print,
} from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  argValueToValueNode,
  setFieldArgument,
  valueNodeToArgValue,
  type ArgValue,
} from '../document-mutator';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

const EpisodeEnum = new GraphQLEnumType({
  name: 'Episode',
  values: { NEWHOPE: { value: 4 }, EMPIRE: { value: 5 }, JEDI: { value: 6 } },
});

const TagInput = new GraphQLInputObjectType({
  name: 'TagInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    count: { type: GraphQLInt },
    episode: { type: EpisodeEnum },
  },
});

const NestedInput = new GraphQLInputObjectType({
  name: 'NestedInput',
  fields: {
    label: { type: GraphQLString },
    tag: { type: TagInput },
  },
});

// ---------------------------------------------------------------------------
// argValueToValueNode
// ---------------------------------------------------------------------------

describe('argValueToValueNode — scalars', () => {
  it('converts a String scalar leaf to StringValue', () => {
    const node = argValueToValueNode(GraphQLString, 'hello');
    expect(node).toEqual({ kind: Kind.STRING, value: 'hello' });
  });

  it('converts an Int scalar leaf to IntValue', () => {
    const node = argValueToValueNode(GraphQLInt, '42');
    expect(node).toEqual({ kind: Kind.INT, value: '42' });
  });

  it('returns undefined for an empty scalar leaf', () => {
    expect(argValueToValueNode(GraphQLString, '')).toBeUndefined();
    expect(argValueToValueNode(GraphQLInt, '')).toBeUndefined();
  });

  it('unwraps NonNull before converting', () => {
    const node = argValueToValueNode(new GraphQLNonNull(GraphQLInt), '7');
    expect(node).toEqual({ kind: Kind.INT, value: '7' });
  });
});

describe('argValueToValueNode — enums', () => {
  it('converts an enum leaf to EnumValue, not StringValue', () => {
    const node = argValueToValueNode(EpisodeEnum, 'JEDI');
    expect(node).toEqual({ kind: Kind.ENUM, value: 'JEDI' });
  });

  it('returns undefined for an empty enum leaf', () => {
    expect(argValueToValueNode(EpisodeEnum, '')).toBeUndefined();
  });
});

describe('argValueToValueNode — list of Int', () => {
  it('produces IntValues, not StringValues', () => {
    const node = argValueToValueNode(new GraphQLList(GraphQLInt), ['1', '2', '3']);
    expect(node?.kind).toBe(Kind.LIST);
    if (node?.kind !== Kind.LIST) {throw new Error('expected LIST');}
    expect(node.values).toHaveLength(3);
    expect(node.values[0]).toEqual({ kind: Kind.INT, value: '1' });
    expect(node.values[1]).toEqual({ kind: Kind.INT, value: '2' });
    expect(node.values[2]).toEqual({ kind: Kind.INT, value: '3' });
  });

  it('produces an empty ListValue for an empty array', () => {
    const node = argValueToValueNode(new GraphQLList(GraphQLInt), []);
    expect(node).toEqual({ kind: Kind.LIST, values: [] });
  });
});

describe('argValueToValueNode — list of enum', () => {
  it('produces EnumValues, not StringValues', () => {
    const node = argValueToValueNode(new GraphQLList(EpisodeEnum), ['NEWHOPE', 'JEDI']);
    expect(node?.kind).toBe(Kind.LIST);
    if (node?.kind !== Kind.LIST) {throw new Error('expected LIST');}
    expect(node.values[0]).toEqual({ kind: Kind.ENUM, value: 'NEWHOPE' });
    expect(node.values[1]).toEqual({ kind: Kind.ENUM, value: 'JEDI' });
  });
});

describe('argValueToValueNode — input object', () => {
  it('converts an input object to ObjectValue with typed fields', () => {
    const node = argValueToValueNode(TagInput, { name: 'hero', count: '5', episode: 'JEDI' });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {throw new Error('expected OBJECT');}
    const byName = Object.fromEntries(node.fields.map(f => [f.name.value, f.value]));
    expect(byName['name']).toEqual({ kind: Kind.STRING, value: 'hero' });
    expect(byName['count']).toEqual({ kind: Kind.INT, value: '5' });
    expect(byName['episode']).toEqual({ kind: Kind.ENUM, value: 'JEDI' });
  });

  it('omits empty-string leaves (matching "remove arg" convention)', () => {
    const node = argValueToValueNode(TagInput, { name: 'hero', count: '' });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {throw new Error('expected OBJECT');}
    const names = node.fields.map(f => f.name.value);
    expect(names).toContain('name');
    expect(names).not.toContain('count');
  });

  it('omits undefined fields', () => {
    const node = argValueToValueNode(TagInput, { name: 'x' });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {throw new Error('expected OBJECT');}
    expect(node.fields).toHaveLength(1);
    expect(node.fields[0]!.name.value).toBe('name');
  });
});

describe('argValueToValueNode — list of input objects', () => {
  it('converts a list of input objects correctly', () => {
    const node = argValueToValueNode(
      new GraphQLList(TagInput),
      [{ name: 'a', count: '1' }, { name: 'b' }],
    );
    expect(node?.kind).toBe(Kind.LIST);
    if (node?.kind !== Kind.LIST) {throw new Error('expected LIST');}
    expect(node.values).toHaveLength(2);
    expect(node.values[0]!.kind).toBe(Kind.OBJECT);
    expect(node.values[1]!.kind).toBe(Kind.OBJECT);
  });
});

describe('argValueToValueNode — nested input object', () => {
  it('recursively converts nested input objects with correct types', () => {
    const node = argValueToValueNode(NestedInput, {
      label: 'outer',
      tag: { name: 'inner', count: '3', episode: 'EMPIRE' },
    });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {throw new Error('expected OBJECT');}
    const tagField = node.fields.find(f => f.name.value === 'tag');
    expect(tagField?.value.kind).toBe(Kind.OBJECT);
    if (tagField?.value.kind !== Kind.OBJECT) {throw new Error('expected nested OBJECT');}
    const countField = tagField.value.fields.find(f => f.name.value === 'count');
    expect(countField?.value).toEqual({ kind: Kind.INT, value: '3' });
    const episodeField = tagField.value.fields.find(f => f.name.value === 'episode');
    expect(episodeField?.value).toEqual({ kind: Kind.ENUM, value: 'EMPIRE' });
  });
});

// ---------------------------------------------------------------------------
// valueNodeToArgValue
// ---------------------------------------------------------------------------

describe('valueNodeToArgValue', () => {
  it('converts an IntValue to string', () => {
    const result = valueNodeToArgValue({ kind: Kind.INT, value: '42' });
    expect(result).toBe('42');
  });

  it('converts a FloatValue to string', () => {
    const result = valueNodeToArgValue({ kind: Kind.FLOAT, value: '3.14' });
    expect(result).toBe('3.14');
  });

  it('converts a StringValue to string', () => {
    const result = valueNodeToArgValue({ kind: Kind.STRING, value: 'hello' });
    expect(result).toBe('hello');
  });

  it('converts an EnumValue to string', () => {
    const result = valueNodeToArgValue({ kind: Kind.ENUM, value: 'JEDI' });
    expect(result).toBe('JEDI');
  });

  it('converts a BooleanValue to "true"/"false"', () => {
    expect(valueNodeToArgValue({ kind: Kind.BOOLEAN, value: true })).toBe('true');
    expect(valueNodeToArgValue({ kind: Kind.BOOLEAN, value: false })).toBe('false');
  });

  it('converts a ListValue to an array', () => {
    const result = valueNodeToArgValue({
      kind: Kind.LIST,
      values: [
        { kind: Kind.INT, value: '1' },
        { kind: Kind.INT, value: '2' },
      ],
    });
    expect(result).toEqual(['1', '2']);
  });

  it('converts an ObjectValue to a plain object', () => {
    const result = valueNodeToArgValue({
      kind: Kind.OBJECT,
      fields: [
        {
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: 'name' },
          value: { kind: Kind.STRING, value: 'Luke' },
        },
        {
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: 'count' },
          value: { kind: Kind.INT, value: '5' },
        },
      ],
    });
    expect(result).toEqual({ name: 'Luke', count: '5' });
  });

  it('returns empty string for NullValue and other unhandled kinds', () => {
    const result = valueNodeToArgValue({ kind: Kind.NULL });
    expect(result).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Round-trip: read → write must reproduce the same printed query
// ---------------------------------------------------------------------------

describe('argValueToValueNode round-trip', () => {
  it('scalar String: read back unchanged produces identical query', () => {
    const original = `{ hero(name: "Luke") }`;
    const d = parse(original, { noLocation: true });
    // Simulate reading the arg value from AST and writing it back
    const argNode = (d.definitions[0] as any).selectionSet.selections[0].arguments[0].value;
    const read: ArgValue = valueNodeToArgValue(argNode);
    // read should be "Luke" (unquoted)
    expect(read).toBe('Luke');
    const written = setFieldArgument(d, ['hero'], 'name', argValueToValueNode(GraphQLString, read as string));
    expect(print(written)).toBe(print(d));
  });

  it('Int arg: read→write produces identical query', () => {
    const d = parse('{ hero(count: 7) }', { noLocation: true });
    const argNode = (d.definitions[0] as any).selectionSet.selections[0].arguments[0].value;
    const read = valueNodeToArgValue(argNode);
    expect(read).toBe('7');
    const written = setFieldArgument(d, ['hero'], 'count', argValueToValueNode(GraphQLInt, read as string));
    expect(print(written)).toBe(print(d));
  });

  it('list of Int: round-trip produces parseable, correct query', () => {
    const d = parse('{ items }', { noLocation: true });
    const listType = new GraphQLList(GraphQLInt);
    const value: ArgValue = ['1', '2', '3'];
    const node = argValueToValueNode(listType, value);
    const written = setFieldArgument(d, ['items'], 'ids', node);
    const printed = print(written);
    // Must be parseable
    expect(() => parse(printed)).not.toThrow();
    // Must contain int values, not quoted strings
    expect(printed).toMatch(/ids: \[1, 2, 3\]/);
    expect(printed).not.toMatch(/"1"/);
  });

  it('list of enum: round-trip produces EnumValues', () => {
    const d = parse('{ hero }', { noLocation: true });
    const listType = new GraphQLList(EpisodeEnum);
    const value: ArgValue = ['NEWHOPE', 'JEDI'];
    const node = argValueToValueNode(listType, value);
    const written = setFieldArgument(d, ['hero'], 'episodes', node);
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
    // Enum values must appear without quotes
    expect(printed).toMatch(/NEWHOPE/);
    expect(printed).toMatch(/JEDI/);
    expect(printed).not.toMatch(/"NEWHOPE"/);
  });

  it('input object with nested enum + Int: round-trip produces correct types', () => {
    const d = parse('{ createTag }', { noLocation: true });
    const value: ArgValue = { name: 'hero', count: '5', episode: 'EMPIRE' };
    const node = argValueToValueNode(TagInput, value);
    const written = setFieldArgument(d, ['createTag'], 'input', node);
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
    // name is a String → must be quoted
    expect(printed).toMatch(/name: "hero"/);
    // count is Int → must NOT be quoted
    expect(printed).toMatch(/count: 5/);
    expect(printed).not.toMatch(/count: "5"/);
    // episode is enum → must NOT be quoted
    expect(printed).toMatch(/episode: EMPIRE/);
    expect(printed).not.toMatch(/episode: "EMPIRE"/);
  });

  it('list of input objects: round-trip is parseable and correct', () => {
    const d = parse('{ createTags }', { noLocation: true });
    const listType = new GraphQLList(TagInput);
    const value: ArgValue = [
      { name: 'a', count: '1' },
      { name: 'b', episode: 'JEDI' },
    ];
    const node = argValueToValueNode(listType, value);
    const written = setFieldArgument(d, ['createTags'], 'tags', node);
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
    expect(printed).toMatch(/name: "a"/);
    expect(printed).toMatch(/count: 1/);
    expect(printed).not.toMatch(/count: "1"/);
    expect(printed).toMatch(/episode: JEDI/);
    expect(printed).not.toMatch(/episode: "JEDI"/);
  });
});
