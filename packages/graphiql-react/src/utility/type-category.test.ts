import { describe, it, expect } from 'vitest';
import {
  GraphQLString,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { typeCategory } from './type-category';

const enumType = new GraphQLEnumType({ name: 'E', values: { A: {} } });
const objectType = new GraphQLObjectType({
  name: 'O',
  fields: { f: { type: GraphQLString } },
});
const interfaceType = new GraphQLInterfaceType({
  name: 'I',
  fields: { f: { type: GraphQLString } },
});
const unionType = new GraphQLUnionType({ name: 'U', types: [objectType] });
const inputType = new GraphQLInputObjectType({
  name: 'In',
  fields: { f: { type: GraphQLString } },
});

describe('typeCategory', () => {
  it('classifies scalars', () => {
    expect(typeCategory(GraphQLString)).toBe('scalar');
    expect(typeCategory(GraphQLInt)).toBe('scalar');
  });
  it('classifies enums', () => {
    expect(typeCategory(enumType)).toBe('enum');
  });
  it('classifies input objects', () => {
    expect(typeCategory(inputType)).toBe('input');
  });
  it('classifies object, interface, and union as composite', () => {
    expect(typeCategory(objectType)).toBe('composite');
    expect(typeCategory(interfaceType)).toBe('composite');
    expect(typeCategory(unionType)).toBe('composite');
  });
  it('unwraps non-null and list wrappers', () => {
    expect(typeCategory(new GraphQLNonNull(GraphQLString))).toBe('scalar');
    expect(typeCategory(new GraphQLList(enumType))).toBe('enum');
    expect(typeCategory(new GraphQLNonNull(new GraphQLList(inputType)))).toBe(
      'input',
    );
  });
});
