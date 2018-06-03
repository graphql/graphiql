/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import {expect} from 'chai';
import {beforeEach, describe, it} from 'mocha';
import fs from 'fs';
import {buildSchema, parse} from 'graphql';
import path from 'path';

import {getDiagnostics, validateQuery, SEVERITY} from '../getDiagnostics';

describe('getDiagnostics', () => {
  let schema;
  beforeEach(async () => {
    const schemaIDL = fs.readFileSync(
      path.join(__dirname, '__schema__/StarWarsSchema.graphql'),
      'utf8',
    );
    schema = buildSchema(schemaIDL);
  });

  it('catches field validation errors', () => {
    const error = validateQuery(parse('query queryName { title }'), schema)[0];
    expect(error.message).to.equal(
      'Cannot query field "title" on type "Query".',
    );
    expect(error.severity).to.equal(SEVERITY.ERROR);
    expect(error.source).to.equal('GraphQL: Validation');
  });

  it('catches field deprecation errors', () => {
    const error = getDiagnostics(
      '{ deprecatedField { testField } }',
      schema,
    )[0];
    expect(error.message).to.equal(
      'The field Query.deprecatedField is deprecated. Use test instead.',
    );
    expect(error.severity).to.equal(SEVERITY.WARNING);
    expect(error.source).to.equal('GraphQL: Deprecation');
  });

  it('returns no errors for valid query', () => {
    const errors = getDiagnostics('query { hero { name } }', schema);
    expect(errors.length).to.equal(0);
  });

  it('returns no errors for valid query with aliases', () => {
    const errors = getDiagnostics(
      'query { superHero: hero { superName: name } superHero2: hero { superName2: name } }',
      schema,
    );
    expect(errors.length).to.equal(0);
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
    expect(errors.length).to.equal(1);
    const error = errors[0];
    expect(error.message).to.equal('Syntax Error: Expected :, found Name "id"');
    expect(error.severity).to.equal(SEVERITY.ERROR);
    expect(error.source).to.equal('GraphQL: Syntax');
  });

  // TODO: change this kitchen sink to depend on the local schema
  //       and then run diagnostics with the schema
  it('returns no errors after parsing kitchen-sink query', () => {
    const kitchenSink = fs.readFileSync(
      path.join(__dirname, '/kitchen-sink.graphql'),
      'utf8',
    );

    const errors = getDiagnostics(kitchenSink);
    expect(errors).to.have.lengthOf(0);
  });
});
