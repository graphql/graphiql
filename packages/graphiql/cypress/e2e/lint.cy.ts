import { version as graphqlVersion } from 'graphql';

describe('Linting', () => {
  it('Marks invalid fields as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        {
          doesNotExist
          test {
            id
          }
        }
      `,
    }).assertLinterMarkWithMessage(
      'doesNotExist',
      'error',
      'Cannot query field "doesNotExist" on type "Test".',
    );
  });

  it('Marks deprecated fields as warning', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        {
          id
          deprecatedField {
            id
          }
        }
      `,
    }).assertLinterMarkWithMessage(
      'deprecatedField',
      'warning',
      'The field Test.deprecatedField is deprecated. No longer in use, try `test` instead.',
    );
  });

  it('Marks syntax errors in variables JSON as error', () => {
    cy.visitWithOp({
      query: '',
      variablesString: JSON.stringify({ stringArg: '42' }, null, 2).slice(
        0,
        -1,
      ),
    }).assertLinterMarkWithMessage(
      '"42"',
      'error',
      'Expected comma or closing brace',
      'variable.json',
    );
  });

  it('Marks unused variables as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        query WithVariables($stringArg: String) {
          hasArgs(string: $stringArg)
        }
      `,
      variables: {
        stringArg: '42',
        unusedVariable: 'whoops',
      },
    }).assertLinterMarkWithMessage(
      'unusedVariable',
      'error',
      'Property unusedVariable is not allowed.',
    );
  });

  it('Marks invalid variable type as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        query WithVariables($stringArg: String) {
          hasArgs(string: $stringArg)
        }
      `,
      variables: {
        stringArg: 42,
      },
    }).assertLinterMarkWithMessage(
      '42',
      'error',
      'Incorrect type. Expected one of string, null.',
      'variable.json',
    );
  });

  it('Marks variables with null values for a non-nullable type as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        query WithVariables($stringArg: String!) {
          hasArgs(string: $stringArg)
        }
      `,
      variables: {
        stringArg: null,
      },
    }).assertLinterMarkWithMessage(
      'null',
      'error',
      'Incorrect type. Expected "string".',
      'variable.json',
    );
  });

  it('Marks variables with non-object values for a input object type as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        query WithVariables($objectArg: TestInput) {
          hasArgs(object: $objectArg)
        }
      `,
      variables: {
        objectArg: '42',
      },
    }).assertLinterMarkWithMessage(
      '"42"',
      'error',
      'Incorrect type. Expected "object".',
      'variable.json',
    );
  });

  it('Marks GraphQL syntax errors as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        {
          doesNotExist
          test {
            id
          }
          +++
        }
      `,
    }).assertLinterMarkWithMessage(
      '+++',
      'error',
      graphqlVersion.startsWith('15.')
        ? 'Syntax Error: Cannot parse the unexpected character "+".'
        : 'Syntax Error: Unexpected character: "+".',
    );
  });
});
