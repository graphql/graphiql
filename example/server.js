/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
import express from 'express';
import graphqlHTTP from 'express-graphql';
import {
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
} from 'graphql';

var app = express();
app.use(express.static(__dirname));
app.use('/graphql', graphqlHTTP(() => ({
  schema: TestSchema
})));
app.listen(8080);
console.log('Started on http://localhost:8080/');

// Schema defined here


// Test Schema

var TestEnum = new GraphQLEnumType({
  name: 'TestEnum',
  values: {
    RED: {},
    GREEN: {},
    BLUE: {},
  }
});

var TestInputObject = new GraphQLInputObjectType({
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
  })
});

var TestInterface = new GraphQLInterfaceType({
  name: 'TestInterface',
  description: 'Test interface.',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'Common name string.'
    }
  }),
  resolveType: check => {
    return check ? UnionFirst : UnionSecond;
  }
});

var UnionFirst = new GraphQLObjectType({
  name: 'First',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'Common name string for UnionFirst.'
    },
    first: {
      type: new GraphQLList(TestInterface),
      resolve: () => { return true; }
    }
  }),
  interfaces: [ TestInterface ]
});

var UnionSecond = new GraphQLObjectType({
  name: 'Second',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: 'Common name string for UnionFirst.'
    },
    second: {
      type: TestInterface,
      resolve: () => { return false; }
    }
  }),
  interfaces: [ TestInterface ]
});

var TestUnion = new GraphQLUnionType({
  name: 'TestUnion',
  types: [ UnionFirst, UnionSecond ],
  resolveType() {
    return UnionFirst;
  }
});

var TestType = new GraphQLObjectType({
  name: 'Test',
  fields: () => ({
    test: {
      type: TestType,
      description: '`test` field from `Test` type.',
      resolve: () => ({})
    },
    union: {
      type: TestUnion,
      description: '> union field from Test type, block-quoted.',
      resolve: () => ({})
    },
    id: {
      type: GraphQLInt,
      description: 'id field from Test type.',
      resolve: () => ({})
    },
    isTest: {
      type: GraphQLBoolean,
      description: 'Is this a test schema? Sure it is.',
      resolve: () => {
        return true;
      }
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
        // List
        listString: { type: new GraphQLList(GraphQLString) },
        listInt: { type: new GraphQLList(GraphQLInt) },
        listFloat: { type: new GraphQLList(GraphQLFloat) },
        listBoolean: { type: new GraphQLList(GraphQLBoolean) },
        listID: { type: new GraphQLList(GraphQLID) },
        listEnum: { type: new GraphQLList(TestEnum) },
        listObject: { type: new GraphQLList(TestInputObject) },
      }
    },
  })
});

var TestMutationType = new GraphQLObjectType({
  name: 'MutationType',
  description: 'This is a simple mutation type',
  fields: {
    setString: {
      type: GraphQLString,
      description: 'Set the string field',
      args: {
        value: { type: GraphQLString }
      }
    }
  }
});

const TestSchema = new GraphQLSchema({
  query: TestType,
  mutation: TestMutationType
});
