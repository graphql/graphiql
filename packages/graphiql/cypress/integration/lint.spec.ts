describe('Linting', () => {
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
      'Syntax Error: Unexpected character: "+".',
    );
  });

  it('Does not mark valid fields', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        {
          myAlias: id
          test {
            id
          }
        }
      `,
    })
      .contains('myAlias')
      .should('not.have.class', 'CodeMirror-lint-mark')
      .and('not.have.class', 'CodeMirror-lint-mark-error');
  });

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
      'The field Test.deprecatedField is deprecated.',
    );
  });

  it('Marks syntax errors in variables JSON as error', () => {
    cy.visitWithOp({
      query: /* GraphQL */ `
        query WithVariables($stringArg: String) {
          hasArgs(string: $stringArg)
        }
      `,
      variablesString: JSON.stringify({ stringArg: '42' }, null, 2).slice(
        0,
        -1,
      ),
    }).assertLinterMarkWithMessage(
      '"42"',
      'error',
      'Expected } but found [end of file].',
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
      'Variable "$unusedVariable" does not appear in any GraphQL query.',
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
      'Expected value of type "String".',
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
      'Type "String!" is non-nullable and cannot be null.',
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
      'Type "TestInput" must be an Object.',
    );
  });
});
