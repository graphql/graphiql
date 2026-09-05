/**
 * The E2E app in `packages/graphiql/src/e2e.ts` uses `createTransport` and the
 * `<GraphiQL transport={...}>` prop. These tests confirm that the response pane
 * header shows real wire metadata from the actual HTTP response (status code,
 * timing, response size) and that the upgrade banner is NOT shown because
 * `transport` is in use, not `fetcher`.
 */

const testQuery = `{
  longDescriptionType {
    id
  }
}`;

describe('Transport API + response pane header', () => {
  it('Loads the ESM test app in production', function () {
    if (Cypress.config('baseUrl') !== 'http://localhost:8080') {
      this.skip();
    }
    cy.intercept('GET', '/dist/e2e/index.js').as('e2eApp');
    cy.visit('/');
    cy.wait('@e2eApp').its('response.statusCode').should('equal', 200);
  });

  it('Shows the real HTTP status code badge after a successful query', () => {
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-status-code').should('contain.text', '200');
    cy.get('.graphiql-response-status').should(
      'have.class',
      'graphiql-response-status--ok',
    );
  });

  it('Shows a real timing badge in ms', () => {
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-meta')
      .first()
      .invoke('text')
      .should('match', /^\d+ms$/);
  });

  it('Shows a non-zero response size badge', () => {
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    // size badge is rendered as e.g. "123 B" or "1.2 KB"
    cy.get('.graphiql-response-meta')
      .last()
      .invoke('text')
      .should('match', /^(\d+\s?B|\d+(?:\.\d+)?\s?KB|\d+(?:\.\d+)?\s?MB)$/);
  });

  it('Surfaces an error status when the response is a 500', () => {
    cy.intercept('/graphql', { statusCode: 500, body: { errors: [] } });
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-status').should(
      'have.class',
      'graphiql-response-status--error',
    );
  });

  it('Does NOT show the upgrade banner when a `transport` is configured', () => {
    cy.visit('/');
    cy.get('.graphiql-transport-upgrade-banner').should('not.exist');
  });
});
