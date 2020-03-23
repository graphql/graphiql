/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import fs from 'fs';
import { buildSchema, parse, GraphQLSchema } from 'graphql';
import path from 'path';

import {
  getDiagnostics,
  validateQuery,
  DIAGNOSTIC_SEVERITY,
} from '../getDiagnostics';

describe('getDiagnostics', () => {
  let schema: GraphQLSchema;
  beforeEach(async () => {
    const schemaIDL = fs.readFileSync(
      path.join(__dirname, '__schema__/StarWarsSchema.graphql'),
      'utf8',
    );

    schema = buildSchema(schemaIDL);
  });

  it('catches field validation errors', () => {
    const error = validateQuery(parse('query queryName { title }'), schema)[0];
    expect(error.message).toEqual(
      'Cannot query field "title" on type "Query".',
    );
    expect(error.severity).toEqual(DIAGNOSTIC_SEVERITY.Error);
    expect(error.source).toEqual('GraphQL: Validation');
  });

  it('catches field deprecation errors', () => {
    const error = getDiagnostics(
      '{ deprecatedField { testField } }',
      schema,
    )[0];
    expect(error.message).toEqual(
      'The field Query.deprecatedField is deprecated. Use test instead.',
    );
    expect(error.severity).toEqual(DIAGNOSTIC_SEVERITY.Warning);
    expect(error.source).toEqual('GraphQL: Deprecation');
  });

  it('returns no errors for valid query', () => {
    const errors = getDiagnostics('query { hero { name } }', schema);
    expect(errors.length).toEqual(0);
  });

  it('returns no errors for valid query with aliases', () => {
    const errors = getDiagnostics(
      'query { superHero: hero { superName: name } superHero2: hero { superName2: name } }',
      schema,
    );
    expect(errors.length).toEqual(0);
  });

  it('catches a syntax error in the SDL', () => {
    const errors = getDiagnostics(
      `
        type Human implements Character {
          field_without_type_is_a_syntax_error
          id: String!
        }
      `,
      schema,
    );
    expect(errors.length).toEqual(1);
    const error = errors[0];
    expect(error.message).toEqual('Syntax Error: Expected :, found Name "id"');
    expect(error.severity).toEqual(DIAGNOSTIC_SEVERITY.Error);
    expect(error.source).toEqual('GraphQL: Syntax');
  });

  // TODO: change this kitchen sink to depend on the local schema
  //       and then run diagnostics with the schema
  it('returns no errors after parsing kitchen-sink query', () => {
    const kitchenSink = fs.readFileSync(
      path.join(__dirname, '/kitchen-sink.graphql'),
      'utf8',
    );

    const errors = getDiagnostics(kitchenSink);
    expect(errors).toHaveLength(0);
  });
});
