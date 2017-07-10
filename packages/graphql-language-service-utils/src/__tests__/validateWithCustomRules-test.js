/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {expect} from 'chai';
import {readFileSync} from 'fs';
import {GraphQLError, buildSchema, parse} from 'graphql';
import {beforeEach, describe, it} from 'mocha';
import {join} from 'path';

import {validateWithCustomRules} from '../validateWithCustomRules';

describe('validateWithCustomRules', () => {
  let schema;

  beforeEach(() => {
    const schemaPath = join(__dirname, '__schema__', 'StarWarsSchema.graphql');
    schema = buildSchema(readFileSync(schemaPath, 'utf8'));
  });

  it('validates with custom rules defined', () => {
    const invalidAST = parse('query { human(id: "a") { name } }');
    const customRules = [
      context => ({
        Argument(node) {
          if (!/^\d+$/.test(node.value.value)) {
            context.reportError(
              new GraphQLError(
                'Argument ID must be a number written in string type.',
                [node],
              ),
            );
          }
        },
      }),
    ];
    const errors = validateWithCustomRules(schema, invalidAST, customRules);
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.equal(
      'Argument ID must be a number written in string type.',
    );
  });

  it('validates properly when the query is in Relay compat mode', () => {
    const astWithUnknownFragment = parse('query { ...UnknownFragment }');
    const noErrors = validateWithCustomRules(
      schema,
      astWithUnknownFragment,
      [],
      true,
    );
    expect(noErrors.length).to.equal(0);

    const errors = validateWithCustomRules(
      schema,
      astWithUnknownFragment,
      [],
      false,
    );
    expect(errors.length).to.equal(1);
    expect(errors[0].message).to.equal('Unknown fragment "UnknownFragment".');
  });
});
