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

import {getDiagnostics, SEVERITY} from '../getDiagnostics';

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
    const error = getDiagnostics(parse('query queryName { title }'), schema)[0];
    expect(error.message).to.equal(
      'Cannot query field "title" on type "Query".',
    );
    expect(error.severity).to.equal(SEVERITY.ERROR);
    expect(error.source).to.equal('GraphQL: Validation');
  });

  it('catches field deprecation errors', () => {
    const error = getDiagnostics(
      parse('{ deprecatedField { testField } }'),
      schema,
    )[0];
    expect(error.message).to.equal(
      'The field Query.deprecatedField is deprecated. Use test instead.',
    );
    expect(error.severity).to.equal(SEVERITY.WARNING);
    expect(error.source).to.equal('GraphQL: Deprecation');
  });

  // TODO: change this kitchen sink to depend on the local schema
  //       and then run diagnostics with the schema
  it('returns no errors after parsing kitchen-sink query', () => {
    const kitchenSink = fs.readFileSync(
      path.join(__dirname, '/kitchen-sink.graphql'),
      'utf8',
    );

    const errors = getDiagnostics(parse(kitchenSink));
    expect(errors).to.have.lengthOf(0);
  });
});
