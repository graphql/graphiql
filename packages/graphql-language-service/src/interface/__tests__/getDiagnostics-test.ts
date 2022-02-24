/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import fs from 'fs';
import {
  buildSchema,
  parse,
  GraphQLSchema,
  GraphQLError,
  ValidationContext,
  ASTVisitor,
  FragmentDefinitionNode,
} from 'graphql';
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

  it('catches multi root validation errors without breaking (with a custom validation function that always throws errors)', () => {
    const error = validateQuery(parse('{ hero { name } } { seq }'), schema, [
      validationContext => {
        return {
          Document(node) {
            for (const definition of node.definitions) {
              // add a custom error to every definition
              validationContext.reportError(
                new GraphQLError(`This is a custom error.`, definition),
              );
            }
            return false;
          },
        };
      },
    ])[0];
    expect(error.message).toEqual('This is a custom error.');
    expect(error.severity).toEqual(DIAGNOSTIC_SEVERITY.Error);
    expect(error.source).toEqual('GraphQL: Validation');
  });

  it('catches field deprecation errors', () => {
    const error = getDiagnostics(
      '{ deprecatedField { testField } }',
      schema,
    )[0];
    expect(error.message).toEqual(
      // eslint-disable-next-line no-useless-escape
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
    expect(error.message).toEqual(
      // eslint-disable-next-line no-useless-escape
      'Syntax Error: Expected ":", found Name "id".',
    );
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

  it('returns a error with a custom validation rule', () => {
    const noQueryRule = (context: ValidationContext): ASTVisitor => ({
      OperationDefinition(node) {
        if (node.operation === 'query') {
          context.reportError(new GraphQLError('No query allowed.', node.name));
        }
      },
    });
    const errors = getDiagnostics(`query hero { hero { id } }`, schema, [
      noQueryRule,
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual('No query allowed.');
  });

  it('validates with external fragments', () => {
    const errors = getDiagnostics(
      `query hero { hero { ...HeroGuy } }`,
      schema,
      [],
      false,
      'fragment HeroGuy on Human { id }',
    );
    expect(errors).toHaveLength(0);
  });
  it('validates with external fragments as array', () => {
    const externalFragments = parse(`
      fragment Person on Human {
        name
      }
      fragment Person2 on Human {
        name
      }
    `).definitions as FragmentDefinitionNode[];
    const errors = getDiagnostics(
      `query hero { hero { ...Person ...Person2 } }`,
      schema,
      [],
      false,
      externalFragments,
    );
    expect(errors).toHaveLength(0);
  });
});
