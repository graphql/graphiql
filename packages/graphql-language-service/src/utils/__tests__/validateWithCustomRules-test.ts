/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { readFileSync } from 'node:fs';
import {
  GraphQLError,
  buildSchema,
  parse,
  GraphQLSchema,
  ValidationContext,
  ArgumentNode,
} from 'graphql';
import { join } from 'node:path';

import { validateWithCustomRules } from '../validateWithCustomRules';

describe('validateWithCustomRules', () => {
  let schema: GraphQLSchema;

  beforeEach(() => {
    const schemaPath = join(__dirname, '__schema__', 'StarWarsSchema.graphql');
    schema = buildSchema(readFileSync(schemaPath, 'utf8'));
  });

  it('validates with custom rules defined', () => {
    const invalidAST = parse('query { human(id: "a") { name } }');
    const customRules = [
      (context: ValidationContext) => ({
        Argument(node: ArgumentNode) {
          // @ts-ignore
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
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
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
    expect(noErrors.length).toEqual(0);

    const errors = validateWithCustomRules(
      schema,
      astWithUnknownFragment,
      [],
      false,
    );
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual('Unknown fragment "UnknownFragment".');
  });

  it('does not validate for Relay @arguments and @argumentDefinition', () => {
    const astWithArgumentsDirective = parse(
      'query { human(id: "1") @arguments(foo: "bar") { name } }',
    );

    expect(
      validateWithCustomRules(schema, astWithArgumentsDirective, []),
    ).toEqual([]);

    const astWithArgumentDefDirective = parse(
      '{ human(id: "2") { name @argumentDefinitions(arg: "foo") } }',
    );

    expect(
      validateWithCustomRules(schema, astWithArgumentDefDirective),
    ).toEqual([]);
  });
});
