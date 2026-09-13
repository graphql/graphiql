import { GraphQLError } from 'graphql';

describe('Errors', () => {
  it('Should show an error when the HTTP request fails', () => {
    cy.intercept('/graphql', {
      statusCode: 502,
      body: 'Bad Gateway',
    });
    cy.visitGraphiQL();
    cy.assertQueryResult({
      errors: [
        {
          message: 'Bad Gateway',
        },
      ],
    });
  });

  it('Should show an error when introspection fails', () => {
    cy.intercept('/graphql', {
      body: { errors: [new GraphQLError('Something unexpected happened...')] },
    });
    cy.visitGraphiQL();
    cy.assertQueryResult({
      errors: [{ message: 'Something unexpected happened...' }],
    });
  });

  it('Should show an error when the schema is invalid', () => {
    cy.intercept('/graphql', { fixture: 'bad-schema.json' });
    cy.visitGraphiQL();
    cy.assertQueryResult({
      errors: [
        {
          message:
            'Names must only contain [_a-zA-Z0-9] but "<img src=x onerror=alert(document.domain)>" does not.',
          extensions: {},
        },
      ],
    });
  });

  it('Should show an error when sending an invalid query', () => {
    cy.visitGraphiQL({ query: '{thisDoesNotExist}' });
    cy.clickExecuteQuery();
    cy.assertQueryResult({
      errors: [
        {
          message: 'Cannot query field "thisDoesNotExist" on type "Test".',
          locations: [{ line: 1, column: 2 }],
        },
      ],
    });
  });

  it('Should show an error when sending an invalid subscription', () => {
    cy.visitGraphiQL({ query: 'subscription {thisDoesNotExist}' });
    cy.clickExecuteQuery();
    cy.assertQueryResult({
      errors: [
        {
          message:
            'Cannot query field "thisDoesNotExist" on type "SubscriptionType".',
          locations: [{ line: 1, column: 15 }],
        },
      ],
    });
    cy.on('uncaught:exception', () => {
      // TODO: should GraphiQL doesn't throw an unhandled promise rejection for subscriptions ?

      // return false to prevent the error from failing this test
      return false;
    });
  });
});
