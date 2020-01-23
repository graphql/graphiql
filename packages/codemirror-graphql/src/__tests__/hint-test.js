/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { expect } from 'chai';
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  __Schema,
  __Type,
} from 'graphql';

import '../hint';
import {
  TestEnum,
  TestInputObject,
  TestSchema,
  TestType,
  TestUnion,
  UnionFirst,
  UnionSecond,
} from './testSchema';

function createEditorWithHint() {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql',
    hintOptions: {
      schema: TestSchema,
      closeOnUnfocus: false,
      completeSingle: false,
    },
  });
}

function getHintSuggestions(queryString, cursor) {
  const editor = createEditorWithHint();
  return new Promise(resolve => {
    const graphqlHint = CodeMirror.hint.graphql;
    CodeMirror.hint.graphql = (cm, options) => {
      const result = graphqlHint(cm, options);
      resolve(result);
      CodeMirror.hint.graphql = graphqlHint;
      return result;
    };

    editor.doc.setValue(queryString);
    editor.doc.setCursor(cursor);
    editor.execCommand('autocomplete');
  });
}

function checkSuggestions(source, suggestions) {
  const titles = suggestions.map(suggestion => suggestion.text);
  expect(titles).to.deep.equal(source);
}

function getExpectedSuggestions(list) {
  return list.map(item => ({
    text: item.text,
    type: item.type,
    description: item.description,
    isDeprecated: item.isDeprecated,
    deprecationReason: item.deprecationReason,
  }));
}

describe('graphql-hint', () => {
  it('attaches a GraphQL hint function with correct mode/hint options', async () => {
    const editor = await createEditorWithHint();
    expect(editor.getHelpers(editor.getCursor(), 'hint')).to.not.have.lengthOf(
      0,
    );
  });

  it('provides correct initial keywords', async () => {
    const suggestions = await getHintSuggestions('', { line: 0, ch: 0 });
    const list = [
      { text: 'query' },
      { text: 'mutation' },
      { text: 'subscription' },
      { text: 'fragment' },
      { text: '{' },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct field name suggestions', async () => {
    const suggestions = await getHintSuggestions('{ ', { line: 0, ch: 2 });
    const list = [
      {
        text: 'test',
        type: TestType,
        isDeprecated: false,
      },
      {
        text: 'union',
        type: TestUnion,
        isDeprecated: false,
      },
      {
        text: 'first',
        type: UnionFirst,
        isDeprecated: false,
      },
      {
        text: 'id',
        type: GraphQLInt,
        isDeprecated: false,
      },
      {
        text: 'isTest',
        type: GraphQLBoolean,
        isDeprecated: false,
      },
      {
        text: 'hasArgs',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
      },
      {
        text: '__schema',
        type: GraphQLNonNull(__Schema),
        description: 'Access the current type schema of this server.',
      },
      {
        text: '__type',
        type: __Type,
        description: 'Request the type information of a single type.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct field name suggestions when using aliases', async () => {
    const suggestions = await getHintSuggestions('{ aliasTest: first { ', {
      line: 0,
      ch: 21,
    });
    const list = [
      {
        text: 'scalar',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: 'first',
        type: TestType,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct field name suggestion indentation', async () => {
    const suggestions = await getHintSuggestions('{\n  ', { line: 1, ch: 2 });
    expect(suggestions.from).to.deep.equal({ line: 1, ch: 2, sticky: null });
    expect(suggestions.to).to.deep.equal({ line: 1, ch: 2, sticky: null });
  });

  it('provides correct argument suggestions', async () => {
    const suggestions = await getHintSuggestions('{ hasArgs ( ', {
      line: 0,
      ch: 12,
    });
    const list = [
      {
        text: 'string',
        type: GraphQLString,
        description: null,
      },
      {
        text: 'int',
        type: GraphQLInt,
        description: null,
      },
      {
        text: 'float',
        type: GraphQLFloat,
        description: null,
      },
      {
        text: 'boolean',
        type: GraphQLBoolean,
        description: null,
      },
      {
        text: 'id',
        type: GraphQLID,
        description: null,
      },
      {
        text: 'enum',
        type: TestEnum,
        description: null,
      },
      {
        text: 'object',
        type: TestInputObject,
        description: null,
      },
      {
        text: 'listString',
        type: new GraphQLList(GraphQLString),
        description: null,
      },
      {
        text: 'listInt',
        type: new GraphQLList(GraphQLInt),
        description: null,
      },
      {
        text: 'listFloat',
        type: new GraphQLList(GraphQLFloat),
        description: null,
      },
      {
        text: 'listBoolean',
        type: new GraphQLList(GraphQLBoolean),
        description: null,
      },
      {
        text: 'listID',
        type: new GraphQLList(GraphQLID),
        description: null,
      },
      {
        text: 'listEnum',
        type: new GraphQLList(TestEnum),
        description: null,
      },
      {
        text: 'listObject',
        type: new GraphQLList(TestInputObject),
        description: null,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct argument suggestions when using aliases', async () => {
    const suggestions = await getHintSuggestions('{ aliasTest: hasArgs ( ', {
      line: 0,
      ch: 23,
    });
    const list = [
      {
        text: 'string',
        type: GraphQLString,
        description: null,
      },
      {
        text: 'int',
        type: GraphQLInt,
        description: null,
      },
      {
        text: 'float',
        type: GraphQLFloat,
        description: null,
      },
      {
        text: 'boolean',
        type: GraphQLBoolean,
        description: null,
      },
      {
        text: 'id',
        type: GraphQLID,
        description: null,
      },
      {
        text: 'enum',
        type: TestEnum,
        description: null,
      },
      {
        text: 'object',
        type: TestInputObject,
        description: null,
      },
      {
        text: 'listString',
        type: new GraphQLList(GraphQLString),
        description: null,
      },
      {
        text: 'listInt',
        type: new GraphQLList(GraphQLInt),
        description: null,
      },
      {
        text: 'listFloat',
        type: new GraphQLList(GraphQLFloat),
        description: null,
      },
      {
        text: 'listBoolean',
        type: new GraphQLList(GraphQLBoolean),
        description: null,
      },
      {
        text: 'listID',
        type: new GraphQLList(GraphQLID),
        description: null,
      },
      {
        text: 'listEnum',
        type: new GraphQLList(TestEnum),
        description: null,
      },
      {
        text: 'listObject',
        type: new GraphQLList(TestInputObject),
        description: null,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct directive suggestions', async () => {
    const suggestions = await getHintSuggestions('{ test (@', {
      line: 0,
      ch: 9,
    });
    const list = [
      {
        text: 'include',
        description:
          'Directs the executor to include this field or fragment only when the `if` argument is true.',
      },
      {
        text: 'skip',
        description:
          'Directs the executor to skip this field or fragment when the `if` argument is true.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct directive suggestions when using aliases', async () => {
    const suggestions = await getHintSuggestions('{ aliasTest: test (@', {
      line: 0,
      ch: 20,
    });
    const list = [
      {
        text: 'include',
        description:
          'Directs the executor to include this field or fragment only when the `if` argument is true.',
      },
      {
        text: 'skip',
        description:
          'Directs the executor to skip this field or fragment when the `if` argument is true.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct directive suggestions on definitions', async () => {
    const suggestions = await getHintSuggestions('type Type @', {
      line: 0,
      ch: 11,
    });
    const list = [
      {
        text: 'onAllDefs',
        description: '',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct directive suggestions on args definitions', async () => {
    const suggestions = await getHintSuggestions(
      'type Type { field(arg: String @',
      { line: 0, ch: 31 },
    );
    const list = [
      {
        text: 'onArg',
        description: '',
      },
      {
        text: 'onAllDefs',
        description: '',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct typeCondition suggestions', async () => {
    const suggestions = await getHintSuggestions('{ union { ... on ', {
      line: 0,
      ch: 17,
    });
    const list = [
      {
        text: 'First',
        description: '',
      },
      {
        text: 'Second',
        description: '',
      },
      {
        text: 'TestInterface',
        description: '',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct typeCondition suggestions on fragment', async () => {
    const suggestions = await getHintSuggestions('fragment Foo on ', {
      line: 0,
      ch: 16,
    });
    const list = [
      {
        text: 'Test',
        description: '',
      },
      {
        text: 'TestUnion',
        description: '',
      },
      {
        text: 'First',
        description: '',
      },
      {
        text: 'TestInterface',
        description: '',
      },
      {
        text: 'Second',
        description: '',
      },
      {
        text: 'MutationType',
        description: 'This is a simple mutation type',
      },
      {
        text: 'SubscriptionType',
        description: 'This is a simple subscription type',
      },
      {
        text: '__Schema',
        description:
          'A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.',
      },
      {
        text: '__Type',
        description:
          'The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name and description, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.',
      },
      {
        text: '__Field',
        description:
          'Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.',
      },
      {
        text: '__InputValue',
        description:
          'Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.',
      },
      {
        text: '__EnumValue',
        description:
          'One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.',
      },
      {
        text: '__Directive',
        description:
          "A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.\n\nIn some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct ENUM suggestions', async () => {
    const suggestions = await getHintSuggestions('{ hasArgs (enum: ', {
      line: 0,
      ch: 17,
    });
    const list = [
      {
        text: 'RED',
        type: TestEnum,
        isDeprecated: false,
      },
      {
        text: 'GREEN',
        type: TestEnum,
        isDeprecated: false,
      },
      {
        text: 'BLUE',
        type: TestEnum,
        isDeprecated: false,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct testInput suggestions', async () => {
    const suggestions = await getHintSuggestions('{ hasArgs (object: { ', {
      line: 0,
      ch: 21,
    });
    const list = [
      {
        text: 'string',
        type: GraphQLString,
      },
      {
        text: 'int',
        type: GraphQLInt,
      },
      {
        text: 'float',
        type: GraphQLFloat,
      },
      {
        text: 'boolean',
        type: GraphQLBoolean,
      },
      {
        text: 'id',
        type: GraphQLID,
      },
      {
        text: 'enum',
        type: TestEnum,
      },
      {
        text: 'object',
        type: TestInputObject,
      },
      {
        text: 'listString',
        type: new GraphQLList(GraphQLString),
      },
      {
        text: 'listInt',
        type: new GraphQLList(GraphQLInt),
      },
      {
        text: 'listFloat',
        type: new GraphQLList(GraphQLFloat),
      },
      {
        text: 'listBoolean',
        type: new GraphQLList(GraphQLBoolean),
      },
      {
        text: 'listID',
        type: new GraphQLList(GraphQLID),
      },
      {
        text: 'listEnum',
        type: new GraphQLList(TestEnum),
      },
      {
        text: 'listObject',
        type: new GraphQLList(TestInputObject),
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides fragment name suggestion', async () => {
    const suggestions = await getHintSuggestions(
      'fragment Foo on Test { id }  query { ...',
      { line: 0, ch: 40 },
    );
    const list = [
      {
        text: 'Foo',
        type: TestType,
        description: 'fragment Foo on Test',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides fragment names for fragments defined lower', async () => {
    const suggestions = await getHintSuggestions(
      'query { ... } fragment Foo on Test { id }',
      { line: 0, ch: 11 },
    );
    const list = [
      {
        text: 'Foo',
        type: TestType,
        description: 'fragment Foo on Test',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides only appropriate fragment names', async () => {
    const suggestions = await getHintSuggestions(
      'fragment Foo on TestUnion { ... } ' +
        'fragment Bar on First { name } ' +
        'fragment Baz on Second { name } ' +
        'fragment Qux on TestUnion { name } ' +
        'fragment Nrf on Test { id }',
      { line: 0, ch: 31 },
    );
    const list = [
      {
        text: 'Bar',
        type: UnionFirst,
        description: 'fragment Bar on First',
      },
      {
        text: 'Baz',
        type: UnionSecond,
        description: 'fragment Baz on Second',
      },
      {
        text: 'Qux',
        type: TestUnion,
        description: 'fragment Qux on TestUnion',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct field name suggestion inside inline fragment', async () => {
    const suggestions = await getHintSuggestions(
      'fragment Foo on TestUnion { ... on First { ',
      { line: 0, ch: 43 },
    );
    const list = [
      {
        text: 'scalar',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: 'first',
        type: TestType,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });

  it('provides correct field name suggestion inside typeless inline fragment', async () => {
    const suggestions = await getHintSuggestions(
      'fragment Foo on First { ... { ',
      { line: 0, ch: 30 },
    );
    const list = [
      {
        text: 'scalar',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: 'first',
        type: TestType,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions.list).to.deep.equal(expectedSuggestions);
  });
});
