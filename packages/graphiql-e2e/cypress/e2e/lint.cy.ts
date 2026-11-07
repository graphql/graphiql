describe('Linting', () => {
  it('Does not mark valid fields', () => {
    const validQuery = /* GraphQL */ `
      {
        myAlias: id
        test {
          id
        }
      }
    `;
    cy.visitGraphiQL({
      query: '{ doesNotExist }',
    }).clearLinterMarksWithValue(validQuery);
  });

  it('Marks invalid fields as error', () => {
    cy.visitGraphiQL({
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
    cy.visitGraphiQL({
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
    cy.visitGraphiQL({
      query: '',
      variables: JSON.stringify({ stringArg: '42' }, null, 2).slice(0, -1),
    }).assertLinterMarkWithMessage(
      '"42"',
      'error',
      'Expected comma or closing brace',
      'variables.json',
    );
  });

  it('Marks unused variables as error', () => {
    cy.visitGraphiQL({
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
      'variables.json',
    );
  });

  it('Marks invalid variable type as error', () => {
    cy.visitGraphiQL({
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
      'variables.json',
    );
  });

  it('Marks variables with null values for a non-nullable type as error', () => {
    cy.visitGraphiQL({
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
      'variables.json',
    );
  });

  it('Marks variables with non-object values for a input object type as error', () => {
    cy.visitGraphiQL({
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
      'variables.json',
    );
  });

  it('Does not mark object variables for a custom scalar with a configured customScalarSchemas as error', () => {
    const validVariables = JSON.stringify({ jsonArg: { foo: 'bar' } }, null, 2);
    cy.visitGraphiQL({
      query: /* GraphQL */ `
        query WithVariables($jsonArg: JSON) {
          hasArgs(json: $jsonArg)
        }
      `,
      variables: '{',
    }).clearLinterMarksWithValue(validVariables, 'variables.json');
  });

  it('Marks GraphQL syntax errors as error', () => {
    cy.visitGraphiQL({
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
      'Syntax Error: Unexpected character: "+".',
    );
  });
});
