import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  parse,
} from 'graphql';
import { describe, expect, it } from 'vitest';
import { inlineFragmentSegment } from '../document-mutator';
import {
  countSelectedFields,
  extractRawArgValue,
  fieldPathAtOffset,
  readVariables,
  resolveFieldNamedType,
  resolveSchemaArg,
} from '../schema-walk';

function doc(query: string) {
  // Keep locations — fieldPathAtOffset needs them.
  return parse(query);
}

describe('readVariables', () => {
  it('parses a JSON object', () => {
    expect(readVariables('{ "a": 1 }')).toEqual({ a: 1 });
  });

  it('returns {} for empty, invalid, or non-object JSON', () => {
    expect(readVariables('')).toEqual({});
    expect(readVariables(null)).toEqual({});
    expect(readVariables('not json')).toEqual({});
    expect(readVariables('[1, 2]')).toEqual({});
  });
});

describe('fieldPathAtOffset', () => {
  it('returns the path of the field under the cursor', () => {
    const query = '{ hero { name } }';
    const d = doc(query);
    const offset = query.indexOf('name') + 1;
    expect(fieldPathAtOffset(d, offset)).toEqual(['hero', 'name']);
  });

  it('includes an inline-fragment segment for a type condition', () => {
    const query = '{ search { ... on Droid { primaryFunction } } }';
    const d = doc(query);
    const offset = query.indexOf('primaryFunction') + 1;
    expect(fieldPathAtOffset(d, offset)).toEqual([
      'search',
      inlineFragmentSegment('Droid'),
      'primaryFunction',
    ]);
  });

  it('returns [] when the cursor is outside any operation', () => {
    expect(fieldPathAtOffset(doc('{ hero }'), 9999)).toEqual([]);
  });
});

describe('extractRawArgValue', () => {
  it('returns a quoted string for a StringValue arg', () => {
    expect(
      extractRawArgValue(doc('{ hero(name: "Luke") }'), ['hero'], 'name'),
    ).toBe('"Luke"');
  });

  it('returns the digits for an Int arg', () => {
    expect(extractRawArgValue(doc('{ hero(id: 42) }'), ['hero'], 'id')).toBe(
      '42',
    );
  });

  it('reaches an arg on a field nested in an inline fragment', () => {
    const d = doc('{ search { ... on Droid { part(id: 7) } } }');
    const path = ['search', inlineFragmentSegment('Droid'), 'part'];
    expect(extractRawArgValue(d, path, 'id')).toBe('7');
  });

  it('returns empty string when the field or arg is missing', () => {
    expect(extractRawArgValue(doc('{ hero }'), ['villain'], 'id')).toBe('');
    expect(extractRawArgValue(doc('{ hero }'), ['hero'], 'id')).toBe('');
  });
});

describe('countSelectedFields', () => {
  it('counts nested fields and descends inline fragments', () => {
    const d = doc('{ hero { name friends { id } } ... on Query { other } }');
    // hero, name, friends, id, other
    expect(countSelectedFields(d)).toBe(5);
  });
});

describe('resolveSchemaArg', () => {
  const Query = new GraphQLObjectType({
    name: 'Query',
    fields: {
      hero: {
        type: GraphQLString,
        args: { id: { type: GraphQLInt } },
      },
    },
  });
  const schema = new GraphQLSchema({ query: Query });

  it('resolves an argument on a root field', () => {
    expect(resolveSchemaArg(schema, 'query', ['hero'], 'id')?.name).toBe('id');
  });

  it('returns undefined for an unknown field or arg', () => {
    expect(resolveSchemaArg(schema, 'query', ['nope'], 'id')).toBeUndefined();
    expect(resolveSchemaArg(schema, 'query', ['hero'], 'nope')).toBeUndefined();
  });

  it('resolves an argument on a field inside an inline fragment', () => {
    const Droid = new GraphQLObjectType({
      name: 'Droid',
      fields: {
        part: { type: GraphQLString, args: { id: { type: GraphQLInt } } },
      },
    });
    const SearchResult = new GraphQLUnionType({
      name: 'SearchResult',
      types: [Droid],
    });
    const RootQuery = new GraphQLObjectType({
      name: 'Query',
      fields: { search: { type: SearchResult } },
    });
    const unionSchema = new GraphQLSchema({ query: RootQuery, types: [Droid] });
    const path = ['search', inlineFragmentSegment('Droid'), 'part'];
    expect(resolveSchemaArg(unionSchema, 'query', path, 'id')?.name).toBe('id');
  });
});

describe('resolveFieldNamedType', () => {
  const Person = new GraphQLObjectType({
    name: 'Person',
    fields: { name: { type: GraphQLString } },
  });
  const Query = new GraphQLObjectType({
    name: 'Query',
    fields: {
      me: { type: Person },
      count: { type: GraphQLInt },
    },
  });
  const schema = new GraphQLSchema({ query: Query });

  it('resolves the named type of a composite field', () => {
    expect(resolveFieldNamedType(schema, 'query', ['me'])?.name).toBe('Person');
  });

  it('resolves a scalar field type', () => {
    expect(resolveFieldNamedType(schema, 'query', ['count'])?.name).toBe('Int');
  });

  it('returns undefined for an empty path or unknown field', () => {
    expect(resolveFieldNamedType(schema, 'query', [])).toBeUndefined();
    expect(resolveFieldNamedType(schema, 'query', ['nope'])).toBeUndefined();
  });
});
