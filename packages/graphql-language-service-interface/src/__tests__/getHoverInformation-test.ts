/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import { Hover } from 'vscode-languageserver-types';

import fs from 'fs';
import { buildSchema } from 'graphql';
import { Position } from 'graphql-language-service-utils';
import path from 'path';

import { getHoverInformation } from '../getHoverInformation';

describe('getHoverInformation', () => {
  let schema;
  beforeEach(async () => {
    const schemaIDL = fs.readFileSync(
    path.join(__dirname, '__schema__/HoverTestSchema.graphql'),
    'utf8');

    schema = buildSchema(schemaIDL);
  });

  function testHover(query: string, point: Position): Hover.contents {
    return getHoverInformation(schema, query, point);
  }

  it('provides leaf field information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { thing { testField } }',
      new Position(0, 20),
    );
    expect(actual).toEqual(
      'TestType.testField: String\n\n This is field documentation for TestType.testField',
    );
=======
    'query { thing { testField } }',
    new Position(0, 20));

    expect(actual).to.deep.equal(
    'TestType.testField: String\n\n This is field documentation for TestType.testField');

>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides aliased field information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { thing { other: testField } }',
      new Position(0, 25),
    );
    expect(actual).toEqual(
      'TestType.testField: String\n\n This is field documentation for TestType.testField',
    );
=======
    'query { thing { other: testField } }',
    new Position(0, 25));

    expect(actual).to.deep.equal(
    'TestType.testField: String\n\n This is field documentation for TestType.testField');

>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides intermediate field information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { thing { testField } }',
      new Position(0, 10),
    );
    expect(actual).toEqual(
      'Query.thing: TestType\n\n This is field documentation for Query.thing',
    );
=======
    'query { thing { testField } }',
    new Position(0, 10));

    expect(actual).to.deep.equal(
    'Query.thing: TestType\n\n This is field documentation for Query.thing');

>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides list field information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { listOfThing { testField } }',
      new Position(0, 10),
    );
    expect(actual).toEqual('Query.listOfThing: [TestType!]');
=======
    'query { listOfThing { testField } }',
    new Position(0, 10));

    expect(actual).to.deep.equal('Query.listOfThing: [TestType!]');
>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides deprecated field information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { thing { testDeprecatedField } }',
      new Position(0, 20),
    );
    expect(actual).toEqual(
      'TestType.testDeprecatedField: Float\n\nDeprecated: deprecation reason',
    );
=======
    'query { thing { testDeprecatedField } }',
    new Position(0, 20));

    expect(actual).to.deep.equal(
    'TestType.testDeprecatedField: Float\n\nDeprecated: deprecation reason');

>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides enum field information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { thing { testEnumField } }',
      new Position(0, 20),
    );
    expect(actual).toEqual('TestType.testEnumField: Color');
=======
    'query { thing { testEnumField } }',
    new Position(0, 20));

    expect(actual).to.deep.equal('TestType.testEnumField: Color');
>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides scalar field information', () => {
    const actual = testHover('query { cluck }', new Position(0, 10));
    expect(actual).toEqual('Query.cluck: Chicken');
  });

  it('provides parameter type information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { parameterizedField(id: "foo") { testField } }',
      new Position(0, 28),
    );
    expect(actual).toEqual('Query.parameterizedField(id: String!)');
=======
    'query { parameterizedField(id: "foo") { testField } }',
    new Position(0, 28));

    expect(actual).to.deep.equal('Query.parameterizedField(id: String!)');
>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides directive information', () => {
    const actual = testHover(
<<<<<<< HEAD:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.js
      'query { thing { testField @skip(if:true) } }',
      new Position(0, 30),
    );
    expect(actual).toEqual(
      '@skip\n\nDirects the executor to skip this field or fragment when the `if` argument is true.',
    );
=======
    'query { thing { testField @skip(if:true) } }',
    new Position(0, 30));

    expect(actual).to.deep.equal(
    '@skip\n\nDirects the executor to skip this field or fragment when the `if` argument is true.');

>>>>>>> chore: first leg of converting LSP packages to TS:packages/graphql-language-service-interface/src/__tests__/getHoverInformation-test.ts
  });

  it('provides union information', () => {
    const actual = testHover('query { unionField }', new Position(0, 12));
    expect(actual).toEqual('Query.unionField: UnionType');
  });
});
