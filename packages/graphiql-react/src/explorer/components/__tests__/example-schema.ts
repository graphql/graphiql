import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLBoolean,
  GraphQLEnumType,
} from 'graphql';

export const ExampleInterface = new GraphQLInterfaceType({
  name: 'exampleInterface',
  fields: {
    name: { type: GraphQLString },
  },
});

export const ExampleEnum = new GraphQLEnumType({
  name: 'exampleEnum',
  values: {
    value1: { value: 'Value 1' },
    value2: { value: 'Value 2' },
    value3: { value: 'Value 3', deprecationReason: 'Only two are needed' },
  },
});

export const ExampleUnionType1 = new GraphQLObjectType({
  name: 'Union_Type_1',
  interfaces: [ExampleInterface],
  fields: {
    name: { type: GraphQLString },
    enum: { type: ExampleEnum },
  },
});

export const ExampleUnionType2 = new GraphQLObjectType({
  name: 'Union_Type_2',
  interfaces: [ExampleInterface],
  fields: {
    name: { type: GraphQLString },
    string: { type: GraphQLString },
  },
});

export const ExampleUnion = new GraphQLUnionType({
  name: 'exampleUnion',
  types: [ExampleUnionType1, ExampleUnionType2],
});

export const ExampleQuery = new GraphQLObjectType({
  name: 'Query',
  description: 'Query description\n Second line',
  fields: {
    string: { type: GraphQLString },
    union: { type: ExampleUnion },
    fieldWithArgs: {
      type: GraphQLString,
      args: {
        stringArg: { type: GraphQLString },
      },
    },
    deprecatedField: {
      type: GraphQLBoolean,
      deprecationReason: 'example deprecation reason',
    },
  },
});

export const ExampleSchema = new GraphQLSchema({
  query: ExampleQuery,
  description: 'GraphQL Schema for testing',
});
