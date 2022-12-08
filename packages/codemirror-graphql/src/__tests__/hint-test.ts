/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

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
import type { GraphQLHintOptions, IHint, IHints } from '../hint';
import '../mode';
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
      externalFragments: 'fragment Example on Test { id }',
    },
  });
}

function getHintSuggestions(queryString: string, cursor: CodeMirror.Position) {
  const editor = createEditorWithHint();

  return new Promise<IHints | undefined>(resolve => {
    const graphqlHint = CodeMirror.hint.graphql;
    CodeMirror.hint.graphql = (
      cm: CodeMirror.Editor,
      options: GraphQLHintOptions,
    ) => {
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

function getExpectedSuggestions(list: IHint[]) {
  return list.map(item => ({
    text: item.text,
    type: item.type,
    description: item.description,
    isDeprecated: item.isDeprecated,
    deprecationReason: item.deprecationReason,
  }));
}

describe('graphql-hint', () => {
  it('attaches a GraphQL hint function with correct mode/hint options', () => {
    const editor = createEditorWithHint();
    expect(editor.getHelpers(editor.getCursor(), 'hint')).not.toHaveLength(0);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct initial keywords after filtered', async () => {
    const suggestions = await getHintSuggestions('q', { line: 0, ch: 1 });
    const list = [{ text: '{' }, { text: 'query' }];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
        type: new GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
        isDeprecated: false,
      },
      {
        text: '__schema',
        type: new GraphQLNonNull(__Schema),
        description: 'Access the current type schema of this server.',
        isDeprecated: false,
      },
      {
        text: '__type',
        type: __Type,
        description: 'Request the type information of a single type.',
        isDeprecated: false,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct field name suggestions after filtered', async () => {
    const suggestions = await getHintSuggestions('{ i', { line: 0, ch: 3 });
    const list = [
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
        text: 'union',
        type: TestUnion,
        isDeprecated: false,
      },
      {
        text: 'first',
        type: UnionFirst,
        isDeprecated: false,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
        text: 'example',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: new GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
        isDeprecated: false,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct field name suggestion indentation', async () => {
    const suggestions = await getHintSuggestions('{\n  ', { line: 1, ch: 2 });
    expect(suggestions?.from).toEqual({ line: 1, ch: 2, sticky: null });
    expect(suggestions?.to).toEqual({ line: 1, ch: 2, sticky: null });
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct argument suggestions after filtered', async () => {
    const suggestions = await getHintSuggestions('{ hasArgs ( f', {
      line: 0,
      ch: 13,
    });
    const list = [
      {
        text: 'float',
        type: GraphQLFloat,
      },
      {
        text: 'listFloat',
        type: new GraphQLList(GraphQLFloat),
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct directive suggestion after filtered', async () => {
    const suggestions = await getHintSuggestions('{ test (@s', {
      line: 0,
      ch: 10,
    });
    const list = [
      {
        text: 'skip',
        description:
          'Directs the executor to skip this field or fragment when the `if` argument is true.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct directive suggestions on args definitions', async () => {
    const suggestions = await getHintSuggestions(
      'type Type { field(arg: String @',
      { line: 0, ch: 31 },
    );
    const list = [
      {
        text: 'deprecated',
        description:
          'Marks an element of a GraphQL schema as no longer supported.',
      },
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides interface suggestions for type when using implements keyword', async () => {
    const suggestions = await getHintSuggestions('type Type implements ', {
      line: 0,
      ch: 21,
    });
    const list = [
      {
        text: 'TestInterface',
        type: TestSchema.getType('TestInterface'),
      },
      {
        text: 'AnotherTestInterface',
        type: TestSchema.getType('AnotherTestInterface'),
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides interface suggestions for interface when using implements keyword', async () => {
    const suggestions = await getHintSuggestions(
      'interface MyInt implements An',
      { line: 0, ch: 29 },
    );
    const list = [
      {
        text: 'AnotherTestInterface',
        type: TestSchema.getType('AnotherTestInterface'),
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides interface suggestions for interface when using implements keyword and multiple interfaces', async () => {
    const suggestions = await getHintSuggestions(
      'interface MyInt implements AnotherTestInterface & T',
      { line: 0, ch: 51 },
    );
    const list = [
      {
        text: 'TestInterface',
        type: TestSchema.getType('TestInterface'),
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
      {
        text: 'AnotherTestInterface',
        description: '',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct typeCondition suggestions after filtered', async () => {
    const suggestions = await getHintSuggestions('{ union { ... on F', {
      line: 0,
      ch: 18,
    });
    const list = [
      {
        text: 'First',
        description: '',
      },
      {
        text: 'TestInterface',
        description: '',
      },
      {
        text: 'AnotherTestInterface',
        description: '',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
        text: 'AnotherTestInterface',
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
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct object field suggestions after filtered', async () => {
    const suggestions = await getHintSuggestions('{ hasArgs (object: { f', {
      line: 0,
      ch: 22,
    });
    const list = [
      {
        text: 'float',
        type: GraphQLFloat,
      },
      {
        text: 'listFloat',
        type: new GraphQLList(GraphQLFloat),
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
      {
        text: 'Example',
        type: TestType,
        description: 'fragment Example on Test',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides fragment names for fragments defined lower', async () => {
    const suggestions = await getHintSuggestions(
      'query { ... }\nfragment Foo on Test { id }',
      { line: 0, ch: 11 },
    );
    const list = [
      {
        text: 'Foo',
        type: TestType,
        description: 'fragment Foo on Test',
      },
      {
        text: 'Example',
        type: TestType,
        description: 'fragment Example on Test',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides only appropriate fragment names', async () => {
    const suggestions = await getHintSuggestions(
      'fragment Foo on TestUnion { ... } ' +
        'fragment Bar on First { name } ' +
        'fragment Baz on Second { name } ' +
        'fragment Qux on TestUnion { name } ' +
        'fragment Nrf on Test { id } ' +
        'fragment Quux on TestInputObject { string } ' +
        'fragment Abc on Xyz { abcdef }',
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
    expect(suggestions?.list).toEqual(expectedSuggestions);
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
        text: 'example',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: new GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
        isDeprecated: false,
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct field name suggestion inside type-less inline fragment', async () => {
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
        text: 'example',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        text: '__typename',
        type: new GraphQLNonNull(GraphQLString),
        description: 'The name of the current Object type at runtime.',
        isDeprecated: false,
      },
    ];

    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct boolean suggestions', async () => {
    const suggestions1 = await getHintSuggestions('{ hasArgs(listBoolean: [ ', {
      line: 0,
      ch: 27,
    });
    const list1 = [
      {
        text: 'true',
        type: GraphQLBoolean,
        description: 'Not false.',
      },
      {
        text: 'false',
        type: GraphQLBoolean,
        description: 'Not true.',
      },
    ];
    const expectedSuggestions1 = getExpectedSuggestions(list1);
    expect(suggestions1?.list).toEqual(expectedSuggestions1);

    const suggestions2 = await getHintSuggestions(
      '{ hasArgs(object: { boolean: t',
      { line: 0, ch: 30 },
    );
    const list2 = [
      {
        text: 'true',
        type: GraphQLBoolean,
        description: 'Not false.',
      },
    ];
    const expectedSuggestions2 = getExpectedSuggestions(list2);
    expect(suggestions2?.list).toEqual(expectedSuggestions2);

    const suggestions3 = await getHintSuggestions('{ hasArgs(boolean: f', {
      line: 0,
      ch: 20,
    });
    const list3 = [
      {
        text: 'false',
        type: GraphQLBoolean,
        description: 'Not true.',
      },
    ];
    const expectedSuggestions3 = getExpectedSuggestions(list3);
    expect(suggestions3?.list).toEqual(expectedSuggestions3);
  });

  it('provides correct variable type suggestions', async () => {
    const suggestions = await getHintSuggestions('query($foo: ', {
      line: 0,
      ch: 12,
    });
    const list = [
      {
        text: 'String',
        description:
          'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
      },
      {
        text: 'Int',
        description:
          'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.',
      },
      {
        text: 'Boolean',
        description: 'The `Boolean` scalar type represents `true` or `false`.',
      },
      {
        text: 'Float',
        description:
          'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).',
      },
      {
        text: 'ID',
        description:
          'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
      },
      { text: 'TestEnum' },
      { text: 'TestInput' },
      {
        text: '__TypeKind',
        description:
          'An enum describing what kind of type a given `__Type` is.',
      },
      {
        text: '__DirectiveLocation',
        description:
          'A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });

  it('provides correct variable type suggestions inside list type', async () => {
    const suggestions = await getHintSuggestions('query($foo: [ ', {
      line: 0,
      ch: 14,
    });
    const list = [
      {
        text: 'String',
        description:
          'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
      },
      {
        text: 'Int',
        description:
          'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.',
      },
      {
        text: 'Boolean',
        description: 'The `Boolean` scalar type represents `true` or `false`.',
      },
      {
        text: 'Float',
        description:
          'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).',
      },
      {
        text: 'ID',
        description:
          'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
      },
      { text: 'TestEnum' },
      { text: 'TestInput' },
      {
        text: '__TypeKind',
        description:
          'An enum describing what kind of type a given `__Type` is.',
      },
      {
        text: '__DirectiveLocation',
        description:
          'A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.',
      },
    ];
    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });
  it('provides no suggestions', async () => {
    const list: IHint[] = [];
    const expectedSuggestions = getExpectedSuggestions(list);

    // kind is FragmentSpread, step is 2
    const suggestions1 = await getHintSuggestions(
      'fragment Foo on Test { id }  query { ...Foo ',
      { line: 0, ch: 45 },
    );
    expect(suggestions1?.list).toEqual(expectedSuggestions);

    // kind is ListType, step is 3
    const suggestions2 = await getHintSuggestions('query($foo: [string] ', {
      line: 0,
      ch: 21,
    });
    expect(suggestions2?.list).toEqual(expectedSuggestions);

    // kind is ListValue, step is 1
    const suggestions3 = await getHintSuggestions(
      '{ hasArgs(listString: ["foo" ',
      {
        line: 0,
        ch: 29,
      },
    );
    expect(suggestions3?.list).toEqual(expectedSuggestions);

    // kind is VariableDefinition, step is 1
    const suggestions4 = await getHintSuggestions('query($foo ', {
      line: 0,
      ch: 11,
    });
    expect(suggestions4?.list).toEqual(expectedSuggestions);

    // kind is Argument, step is 1
    const suggestions5 = await getHintSuggestions('{ hasArgs(string ', {
      line: 0,
      ch: 17,
    });
    expect(suggestions5?.list).toEqual(expectedSuggestions);

    // kind is Argument, step is 2, and input type isn't GraphQLEnumType or GraphQLBoolean
    const suggestions6 = await getHintSuggestions('{ hasArgs(string: ', {
      line: 0,
      ch: 18,
    });
    expect(suggestions6?.list).toEqual(expectedSuggestions);

    const suggestions7 = await getHintSuggestions(
      '{ hasArgs(object: { string ',
      { line: 0, ch: 27 },
    );
    expect(suggestions7?.list).toEqual(expectedSuggestions);
  });
  it('provides variable completion for arguments', async () => {
    const expectedSuggestions = getExpectedSuggestions([
      { text: 'string', type: GraphQLString },
      { text: 'listString', type: new GraphQLList(GraphQLString) },
    ]);
    // kind is Argument, step is 2, and input type isn't GraphQLEnumType or GraphQLBoolean
    const suggestions9 = await getHintSuggestions(
      'query myQuery($arg: String){ hasArgs(string: ',
      {
        line: 0,
        ch: 42,
      },
    );
    expect(suggestions9?.list).toEqual(expectedSuggestions);
  });
  it('provides variable completion for arguments with $', async () => {
    const expectedSuggestions = getExpectedSuggestions([
      { text: 'string', type: GraphQLString },
      { text: 'listString', type: new GraphQLList(GraphQLString) },
    ]);
    // kind is Argument, step is 2, and input type isn't GraphQLEnumType or GraphQLBoolean
    const suggestions9 = await getHintSuggestions(
      'query myQuery($arg: String){ hasArgs(string: $',
      {
        line: 0,
        ch: 42,
      },
    );
    expect(suggestions9?.list).toEqual(expectedSuggestions);
  });
  it('provides correct field name suggestions for an interface type', async () => {
    const suggestions = await getHintSuggestions(
      '{ first { ... on TestInterface { ',
      {
        line: 0,
        ch: 33,
      },
    );
    const list = [
      {
        text: 'scalar',
        type: GraphQLString,
        isDeprecated: false,
      },
      {
        description: 'The name of the current Object type at runtime.',
        isDeprecated: false,
        text: '__typename',
        type: new GraphQLNonNull(GraphQLString),
        deprecationReason: undefined,
      },
    ];

    const expectedSuggestions = getExpectedSuggestions(list);
    expect(suggestions?.list).toEqual(expectedSuggestions);
  });
});
