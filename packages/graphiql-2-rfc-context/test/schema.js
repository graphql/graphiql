/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLID,
  GraphQLList,
} = require('graphql');

// Test Schema
const TestEnum = new GraphQLEnumType({
  name: 'TestEnum',
  description: 'An enum of super cool colors.',
  values: {
    RED: { description: 'A rosy color' },
    GREEN: { description: 'The color of martians and slime' },
    BLUE: { description: "A feeling you might have if you can't use GraphQL" },
    GRAY: {
      description: 'A really dull color',
      deprecationReason: 'Colors are available now.',
    },
  },
});

const TestInputObject = new GraphQLInputObjectType({
  name: 'TestInput',
  description: 'Test all sorts of inputs in this input object type.',
  fields: () => ({
    string: {
      type: GraphQLString,
      description: 'Repeats back this string',
    },
    int: { type: GraphQLInt },
    float: { type: GraphQLFloat },
    boolean: { type: GraphQLBoolean },
    id: { type: GraphQLID },
    enum: { type: TestEnum },
    object: { type: TestInputObject },
    defaultValueString: {
      type: GraphQLString,
      defaultValue: 'test default value',
    },
    defaultValueBoolean: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    defaultValueInt: {
      type: GraphQLInt,
      defaultValue: 5,
    },
    // List
    listString: { type: new GraphQLList(GraphQLString) },
    listInt: { type: new GraphQLList(GraphQLInt) },
    listFloat: { type: new GraphQLList(GraphQLFloat) },
    listBoolean: { type: new GraphQLList(GraphQLBoolean) },
    listID: { type: new GraphQLList(GraphQLID) },
    listEnum: { type: new GraphQLList(TestEnum) },
    listObject: { type: new GraphQLList(TestInputObject) },
  }),
});

const TestInterface = new GraphQLInterfaceType({
  name: 'TestInterface',
  description: 'Test interface.',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'Common name string.',
    },
  }),
  resolveType: check => {
    return check ? UnionFirst : UnionSecond;
  },
});

const UnionFirst = new GraphQLObjectType({
  name: 'First',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'Common name string for UnionFirst.',
    },
    first: {
      type: new GraphQLList(TestInterface),
      resolve: () => {
        return true;
      },
    },
  }),
  interfaces: [TestInterface],
});

const UnionSecond = new GraphQLObjectType({
  name: 'Second',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'Common name string for UnionFirst.',
    },
    second: {
      type: TestInterface,
      resolve: () => {
        return false;
      },
    },
  }),
  interfaces: [TestInterface],
});

const TestUnion = new GraphQLUnionType({
  name: 'TestUnion',
  types: [UnionFirst, UnionSecond],
  resolveType() {
    return UnionFirst;
  },
});

const TestType = new GraphQLObjectType({
  name: 'Test',
  fields: () => ({
    test: {
      type: TestType,
      description: '`test` field from `Test` type.',
      resolve: () => ({}),
    },
    longDescriptionType: {
      type: TestType,
      description:
        '`longDescriptionType` field from `Test` type, which ' +
        'has a long, verbose, description to test inline field docs',
      resolve: () => ({}),
    },
    union: {
      type: TestUnion,
      description: '> union field from Test type, block-quoted.',
      resolve: () => ({}),
    },
    id: {
      type: GraphQLID,
      description: 'id field from Test type.',
      resolve: () => 'abc123',
    },
    isTest: {
      type: GraphQLBoolean,
      description: 'Is this a test schema? Sure it is.',
      resolve: () => {
        return true;
      },
    },
    image: {
      type: GraphQLString,
      description: 'field that returns an image URI.',
      resolve: () => '/images/logo.svg',
    },
    deprecatedField: {
      type: TestType,
      description: 'This field is an example of a deprecated field',
      deprecationReason: 'No longer in use, try `test` instead.',
    },
    hasArgs: {
      type: GraphQLString,
      resolve(value, args) {
        return JSON.stringify(args);
      },
      args: {
        string: { type: GraphQLString },
        int: { type: GraphQLInt },
        float: { type: GraphQLFloat },
        boolean: { type: GraphQLBoolean },
        id: { type: GraphQLID },
        enum: { type: TestEnum },
        object: { type: TestInputObject },
        defaultValue: {
          type: GraphQLString,
          defaultValue: 'test default value',
        },
        // List
        listString: { type: new GraphQLList(GraphQLString) },
        listInt: { type: new GraphQLList(GraphQLInt) },
        listFloat: { type: new GraphQLList(GraphQLFloat) },
        listBoolean: { type: new GraphQLList(GraphQLBoolean) },
        listID: { type: new GraphQLList(GraphQLID) },
        listEnum: { type: new GraphQLList(TestEnum) },
        listObject: { type: new GraphQLList(TestInputObject) },
      },
    },
  }),
});

const TestMutationType = new GraphQLObjectType({
  name: 'MutationType',
  description: 'This is a simple mutation type',
  fields: {
    setString: {
      type: GraphQLString,
      description: 'Set the string field',
      args: {
        value: { type: GraphQLString },
      },
    },
  },
});

const TestSubscriptionType = new GraphQLObjectType({
  name: 'SubscriptionType',
  description: 'This is a simple subscription type',
  fields: {
    subscribeToTest: {
      type: TestType,
      description: 'Subscribe to the test type',
      args: {
        id: { type: GraphQLString },
      },
    },
  },
});

const myTestSchema = new GraphQLSchema({
  query: TestType,
  mutation: TestMutationType,
  subscription: TestSubscriptionType,
});

module.exports = myTestSchema;
