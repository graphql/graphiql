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
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLID,
  GraphQLList,
} from 'graphql';

var app = express();
app.use(express.static(__dirname));
app.listen(8080, () => {
  app.use('/graphql', graphqlHTTP(() => ({
    schema: TestSchema
  })));
  console.log('Started with test schema on http://localhost:8080/');
})
.on('error', (e) => {
  // If 8080 is in use, assume we are using realy-starter-kit
  // and start on 8081.
  if (e.code == 'EADDRINUSE') {
    app.listen(8081, () => {
      console.log('http://localhost:8080 is in use.');
      console.log('Assuming relay-starter-kit is running.');
      console.log('Free up port 8080 if not using relay-starter-kit.');
      console.log('Started with no schema on http://localhost:8081/');
    });
  }
})

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

var UnionFirst = new GraphQLObjectType({
  name: 'First',
  fields: () => ({
    first: {
      type: TestType,
      resolve: () => ({})
    }
  })
});

var UnionSecond = new GraphQLObjectType({
  name: 'Second',
  fields: () => ({
    second: {
      type: TestType,
      resolve: () => ({})
    }
  })
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
      resolve: () => ({})
    },
    union: {
      type: TestUnion,
      resolve: () => ({})
    },
    id: {
      type: GraphQLInt,
      resolve: () => ({})
    },
    isTest: {
      type: GraphQLBoolean,
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
