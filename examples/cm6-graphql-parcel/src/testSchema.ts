/* istanbul ignore file */
/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  DirectiveLocation,
  GraphQLBoolean,
  GraphQLDeprecatedDirective,
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLIncludeDirective,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLSkipDirective,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';

// Test Schema

export const TestEnum = new GraphQLEnumType({
  name: 'TestEnum',
  values: {
    RED: {},
    GREEN: {},
    BLUE: {},
  },
});

export const TestInputObject: GraphQLInputObjectType =
  new GraphQLInputObjectType({
    name: 'TestInput',
    fields: () => ({
      string: { type: GraphQLString },
      int: { type: GraphQLInt },
      float: { type: GraphQLFloat },
      boolean: { type: GraphQLBoolean },
      id: { type: GraphQLID },
      enum: { type: TestEnum },
      object: { type: TestInputObject },
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

const TestInterface: GraphQLInterfaceType = new GraphQLInterfaceType({
  name: 'TestInterface',
  resolveType: () => UnionFirst,
  fields: {
    scalar: {
      type: GraphQLString,
      resolve: () => ({}),
    },
  },
});

const AnotherTestInterface: GraphQLInterfaceType = new GraphQLInterfaceType({
  name: 'AnotherTestInterface',
  resolveType: () => UnionFirst,
  fields: {
    example: {
      type: GraphQLString,
      resolve: () => ({}),
    },
  },
});

export const UnionFirst = new GraphQLObjectType({
  name: 'First',
  interfaces: [TestInterface, AnotherTestInterface],
  fields: () => ({
    scalar: {
      type: GraphQLString,
      resolve: () => ({}),
    },
    first: {
      type: TestType,
      resolve: () => ({}),
    },
    example: {
      type: GraphQLString,
      resolve: () => ({}),
    },
  }),
});

export const UnionSecond = new GraphQLObjectType({
  name: 'Second',
  fields: () => ({
    second: {
      type: TestType,
      resolve: () => ({}),
    },
  }),
});

export const TestUnion = new GraphQLUnionType({
  name: 'TestUnion',
  types: [UnionFirst, UnionSecond],
  resolveType() {
    return UnionFirst;
  },
});

export const TestType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Test',
  fields: () => ({
    test: {
      type: TestType,
      resolve: () => ({}),
    },
    deprecatedTest: {
      type: TestType,
      deprecationReason: 'Use test instead.',
      resolve: () => ({}),
    },
    union: {
      type: TestUnion,
      resolve: () => ({}),
    },
    first: {
      type: UnionFirst,
      resolve: () => ({}),
    },
    id: {
      type: GraphQLInt,
      resolve: () => ({}),
    },
    isTest: {
      type: GraphQLBoolean,
      resolve: () => {
        return true;
      },
    },
    hasArgs: {
      type: GraphQLString,
      resolve(_value, args) {
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

const OnArgDirective = new GraphQLDirective({
  name: 'onArg',
  locations: [DirectiveLocation.ARGUMENT_DEFINITION],
});

const OnAllDefsDirective = new GraphQLDirective({
  name: 'onAllDefs',
  locations: [
    DirectiveLocation.SCHEMA,
    DirectiveLocation.SCALAR,
    DirectiveLocation.OBJECT,
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.INTERFACE,
    DirectiveLocation.UNION,
    DirectiveLocation.ENUM,
    DirectiveLocation.ENUM_VALUE,
    DirectiveLocation.INPUT_OBJECT,
    DirectiveLocation.ARGUMENT_DEFINITION,
    DirectiveLocation.INPUT_FIELD_DEFINITION,
  ],
});

export const TestSchema = new GraphQLSchema({
  query: TestType,
  mutation: TestMutationType,
  subscription: TestSubscriptionType,
  directives: [
    GraphQLIncludeDirective,
    GraphQLSkipDirective,
    GraphQLDeprecatedDirective,
    OnArgDirective,
    OnAllDefsDirective,
  ],
});
