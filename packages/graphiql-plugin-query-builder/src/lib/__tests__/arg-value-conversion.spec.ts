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
  fieldSegment,
  setFieldArgument,
  valueNodeToArgValue,
  type ArgValue,
} from '../document-mutator';

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
    const node = argValueToValueNode(new GraphQLList(GraphQLInt), [
      '1',
      '2',
      '3',
    ]);
    expect(node?.kind).toBe(Kind.LIST);
    if (node?.kind !== Kind.LIST) {
      throw new Error('expected LIST');
    }
    expect(node.values).toHaveLength(3);
    expect(node.values[0]).toEqual({ kind: Kind.INT, value: '1' });
    expect(node.values[1]).toEqual({ kind: Kind.INT, value: '2' });
    expect(node.values[2]).toEqual({ kind: Kind.INT, value: '3' });
  });

  it('returns undefined for an empty array (matching "remove arg" convention)', () => {
    const node = argValueToValueNode(new GraphQLList(GraphQLInt), []);
    expect(node).toBeUndefined();
  });

  it('returns undefined when every item projects away', () => {
    // Empty-string scalars are the "remove arg" sentinel; a list of only empty
    // items projects to nothing and should not emit an arg at all.
    const node = argValueToValueNode(new GraphQLList(GraphQLString), ['', '']);
    expect(node).toBeUndefined();
  });
});

describe('argValueToValueNode — list of enum', () => {
  it('produces EnumValues, not StringValues', () => {
    const node = argValueToValueNode(new GraphQLList(EpisodeEnum), [
      'NEWHOPE',
      'JEDI',
    ]);
    expect(node?.kind).toBe(Kind.LIST);
    if (node?.kind !== Kind.LIST) {
      throw new Error('expected LIST');
    }
    expect(node.values[0]).toEqual({ kind: Kind.ENUM, value: 'NEWHOPE' });
    expect(node.values[1]).toEqual({ kind: Kind.ENUM, value: 'JEDI' });
  });
});

describe('argValueToValueNode — input object', () => {
  it('converts an input object to ObjectValue with typed fields', () => {
    const node = argValueToValueNode(TagInput, {
      name: 'hero',
      count: '5',
      episode: 'JEDI',
    });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {
      throw new Error('expected OBJECT');
    }
    const byName = Object.fromEntries(
      node.fields.map(f => [f.name.value, f.value]),
    );
    expect(byName['name']).toEqual({ kind: Kind.STRING, value: 'hero' });
    expect(byName['count']).toEqual({ kind: Kind.INT, value: '5' });
    expect(byName['episode']).toEqual({ kind: Kind.ENUM, value: 'JEDI' });
  });

  it('omits empty-string leaves (matching "remove arg" convention)', () => {
    const node = argValueToValueNode(TagInput, { name: 'hero', count: '' });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {
      throw new Error('expected OBJECT');
    }
    const names = node.fields.map(f => f.name.value);
    expect(names).toContain('name');
    expect(names).not.toContain('count');
  });

  it('omits undefined fields', () => {
    const node = argValueToValueNode(TagInput, { name: 'x' });
    expect(node?.kind).toBe(Kind.OBJECT);
    if (node?.kind !== Kind.OBJECT) {
      throw new Error('expected OBJECT');
    }
    expect(node.fields).toHaveLength(1);
    expect(node.fields[0]!.name.value).toBe('name');
  });

  it('returns undefined when every field projects away', () => {
    const node = argValueToValueNode(TagInput, { name: '', count: '' });
    expect(node).toBeUndefined();
  });
});

describe('argValueToValueNode — list of input objects', () => {
  it('converts a list of input objects correctly', () => {
    const node = argValueToValueNode(new GraphQLList(TagInput), [
      { name: 'a', count: '1' },
      { name: 'b' },
    ]);
    expect(node?.kind).toBe(Kind.LIST);
    if (node?.kind !== Kind.LIST) {
      throw new Error('expected LIST');
    }
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
    if (node?.kind !== Kind.OBJECT) {
      throw new Error('expected OBJECT');
    }
    const tagField = node.fields.find(f => f.name.value === 'tag');
    expect(tagField?.value.kind).toBe(Kind.OBJECT);
    if (tagField?.value.kind !== Kind.OBJECT) {
      throw new Error('expected nested OBJECT');
    }
    const countField = tagField.value.fields.find(
      f => f.name.value === 'count',
    );
    expect(countField?.value).toEqual({ kind: Kind.INT, value: '3' });
    const episodeField = tagField.value.fields.find(
      f => f.name.value === 'episode',
    );
    expect(episodeField?.value).toEqual({ kind: Kind.ENUM, value: 'EMPIRE' });
  });
});

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
    expect(valueNodeToArgValue({ kind: Kind.BOOLEAN, value: true })).toBe(
      'true',
    );
    expect(valueNodeToArgValue({ kind: Kind.BOOLEAN, value: false })).toBe(
      'false',
    );
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

  // Known limitation: the builder has no representation for an explicit `null`
  // argument, and `''` is its "absent / remove this arg" sentinel. So a read
  // `NullValue` collapses to `''`, which means an explicit `arg: null` written
  // by hand is NOT preserved across a builder round-trip (it reads as empty and
  // is dropped on the next write). Other unhandled value kinds collapse the same
  // way. This documents that behavior; it is not an endorsement of it.
  it('collapses an explicit NullValue to the empty/remove sentinel (known limitation)', () => {
    const result = valueNodeToArgValue({ kind: Kind.NULL });
    expect(result).toBe('');
  });
});

describe('argValueToValueNode round-trip', () => {
  it('scalar String: read back unchanged produces identical query', () => {
    const original = `{ hero(name: "Luke") }`;
    const d = parse(original, { noLocation: true });
    const argNode = (d.definitions[0] as any).selectionSet.selections[0]
      .arguments[0].value;
    const read: ArgValue = valueNodeToArgValue(argNode);
    expect(read).toBe('Luke');
    const written = setFieldArgument(
      d,
      [fieldSegment('hero')],
      'name',
      argValueToValueNode(GraphQLString, read as string),
      { kind: 'operation' },
    );
    expect(print(written)).toBe(print(d));
  });

  it('Int arg: read→write produces identical query', () => {
    const d = parse('{ hero(count: 7) }', { noLocation: true });
    const argNode = (d.definitions[0] as any).selectionSet.selections[0]
      .arguments[0].value;
    const read = valueNodeToArgValue(argNode);
    expect(read).toBe('7');
    const written = setFieldArgument(
      d,
      [fieldSegment('hero')],
      'count',
      argValueToValueNode(GraphQLInt, read as string),
      { kind: 'operation' },
    );
    expect(print(written)).toBe(print(d));
  });

  it('list of Int: round-trip produces parseable, correct query', () => {
    const d = parse('{ items }', { noLocation: true });
    const listType = new GraphQLList(GraphQLInt);
    const value: ArgValue = ['1', '2', '3'];
    const node = argValueToValueNode(listType, value);
    const written = setFieldArgument(d, [fieldSegment('items')], 'ids', node, {
      kind: 'operation',
    });
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
    expect(printed).toMatch(/ids: \[1, 2, 3\]/);
    expect(printed).not.toMatch(/"1"/);
  });

  it('list of enum: round-trip produces EnumValues', () => {
    const d = parse('{ hero }', { noLocation: true });
    const listType = new GraphQLList(EpisodeEnum);
    const value: ArgValue = ['NEWHOPE', 'JEDI'];
    const node = argValueToValueNode(listType, value);
    const written = setFieldArgument(
      d,
      [fieldSegment('hero')],
      'episodes',
      node,
      { kind: 'operation' },
    );
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
    expect(printed).toMatch(/NEWHOPE/);
    expect(printed).toMatch(/JEDI/);
    expect(printed).not.toMatch(/"NEWHOPE"/);
  });

  it('input object with nested enum + Int: round-trip produces correct types', () => {
    const d = parse('{ createTag }', { noLocation: true });
    const value: ArgValue = { name: 'hero', count: '5', episode: 'EMPIRE' };
    const node = argValueToValueNode(TagInput, value);
    const written = setFieldArgument(
      d,
      [fieldSegment('createTag')],
      'input',
      node,
      { kind: 'operation' },
    );
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
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
    const written = setFieldArgument(
      d,
      [fieldSegment('createTags')],
      'tags',
      node,
      { kind: 'operation' },
    );
    const printed = print(written);
    expect(() => parse(printed)).not.toThrow();
    expect(printed).toMatch(/name: "a"/);
    expect(printed).toMatch(/count: 1/);
    expect(printed).not.toMatch(/count: "1"/);
    expect(printed).toMatch(/episode: JEDI/);
    expect(printed).not.toMatch(/episode: "JEDI"/);
  });
});
