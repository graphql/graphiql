/* eslint-disable no-await-in-loop */
/**
 *  Copyright (c) 2021 GraphQL Contributors.
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

const Greeting = new GraphQLObjectType({
  name: 'Greeting',
  fields: {
    text: {
      type: GraphQLString,
    },
  },
});

const delayArgument = (defaultValue = 400) => ({
  description:
    'delay in milleseconds for subsequent results, for demonstration purposes',
  type: GraphQLInt,
  defaultValue,
});

const DeferrableObject = new GraphQLObjectType({
  name: 'Deferrable',
  fields: {
    normalString: {
      type: GraphQLString,
      resolve: () => `Nice`,
    },
    deferredString: {
      args: {
        delay: delayArgument(600),
      },
      type: GraphQLString,
      resolve: async function lazilyReturnValue(_value, args) {
        const seconds = args.delay / 1000;
        await sleep(args.delay);
        return `Oops, this took ${seconds} seconds longer than I thought it would!`;
      },
    },
  },
});

const Person = new GraphQLObjectType({
  name: 'Person',
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: obj => obj.name,
    },
    age: {
      args: {
        delay: delayArgument(600),
      },
      type: GraphQLInt,
      resolve: async function lazilyReturnValue(_value, args) {
        await sleep(args.delay);
        return Math.ceil(args.delay);
      },
    },
    friends: {
      type: new GraphQLList(Person),
      async *resolve(_value, args) {
        const names = ['James', 'Mary', 'John', 'Patrica']; // Top 4 names https://www.ssa.gov/oact/babynames/decades/century.html
        for (const name of names) {
          await sleep(100);
          yield { name };
        }
      },
    },
  }),
});

const sleep = async timeout => new Promise(res => setTimeout(res, timeout));

const TestType = new GraphQLObjectType({
  name: 'Test',
  description: 'Test type for testing\n New line works',
  fields: () => ({
    test: {
      type: TestType,
      description: '`test` field from `Test` type.',
      resolve: () => ({}),
    },
    deferrable: {
      type: DeferrableObject,
      resolve: () => ({}),
    },
    streamable: {
      type: new GraphQLList(Greeting),
      args: {
        delay: delayArgument(300),
      },
      resolve: async function* sayHiInSomeLanguages(_value, args) {
        let i = 0;
        for (const hi of [
          'Hi',
          '你好',
          'Hola',
          'أهلاً',
          'Bonjour',
          'سلام',
          '안녕',
          'Ciao',
          'हेलो',
          'Здорово',
        ]) {
          if (i > 2) {
            await sleep(args.delay);
          }
          i++;
          yield { text: hi };
        }
      },
    },
    person: {
      type: Person,
      resolve: () => ({ name: 'Mark' }),
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
      resolve(_value, args) {
        return JSON.stringify(args);
      },
      args: {
        string: { type: GraphQLString, description: 'A string' },
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
        deprecatedArg: {
          type: GraphQLString,
          deprecationReason: 'deprecated argument',
          description: 'Hello!',
        },
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
  description:
    'This is a simple subscription type. Learn more at https://www.npmjs.com/package/graphql-ws',
  fields: {
    message: {
      type: GraphQLString,
      description: 'Subscribe to a message',
      args: {
        delay: delayArgument(600),
      },
      async *subscribe(root, args) {
        for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
          if (args?.delay) {
            await sleep(args.delay);
          }
          yield { message: hi };
        }
      },
    },
  },
});

const myTestSchema = new GraphQLSchema({
  query: TestType,
  mutation: TestMutationType,
  subscription: TestSubscriptionType,
  description: 'This is a test schema for GraphiQL',
});

module.exports = myTestSchema;
