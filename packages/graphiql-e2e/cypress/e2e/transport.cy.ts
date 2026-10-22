/**
 * The E2E app in `packages/graphiql-e2e/src/e2e.ts` uses `createTransport` and the
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
  it('Shows the real HTTP status code badge after a successful query', () => {
    cy.visitGraphiQL({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-status-code').should('contain.text', '200');
    cy.get('.graphiql-response-status').should(
      'have.class',
      'graphiql-response-status--ok',
    );
  });

  it('Shows a real timing badge in ms', () => {
    cy.visitGraphiQL({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-meta')
      .first()
      .invoke('text')
      .should('match', /^\d+ms$/);
  });

  it('Shows a non-zero response size badge', () => {
    cy.visitGraphiQL({ query: testQuery });
    cy.clickExecuteQuery();
    // size badge is rendered as e.g. "123 B" or "1.2 KB"
    cy.get('.graphiql-response-meta')
      .last()
      .invoke('text')
      .should('match', /^(\d+\s?B|\d+(?:\.\d+)?\s?KB|\d+(?:\.\d+)?\s?MB)$/);
  });

  it('Surfaces an error status when the response is a 500', () => {
    cy.intercept('/graphql', { statusCode: 500, body: { errors: [] } });
    cy.visitGraphiQL({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-status').should(
      'have.class',
      'graphiql-response-status--error',
    );
  });

  it('Does NOT show the upgrade banner when a `transport` is configured', () => {
    cy.visitGraphiQL();
    cy.get('.graphiql-transport-upgrade-banner').should('not.exist');
  });
});

describe('Transport routing for mutations', () => {
  it('executes mutations through POST from the button, dropdown, and shortcut while GET stays selected', () => {
    const mutationMethods: string[] = [];
    cy.intercept('/graphql*', request => {
      const operationName =
        request.method === 'GET'
          ? new URL(request.url).searchParams.get('operationName')
          : request.body?.operationName;
      if (operationName === 'Change') {
        mutationMethods.push(request.method);
        request.alias = 'mutation';
      }
    });
    cy.visitGraphiQL({
      query: 'query Read { __typename }\nmutation Change { __typename }\n',
    });
    cy.get('.graphiql-top-bar-method-toggle').click();
    cy.get('.graphiql-top-bar-method-toggle').click();
    cy.get('.graphiql-top-bar-method-toggle').should('have.text', 'GET');
    cy.activateOperation('Change');

    cy.get('[aria-label="Run operation"]').should('be.enabled').click();
    cy.wait('@mutation').its('request.method').should('eq', 'POST');
    cy.get('.result-window').should('contain.text', 'MutationType');
    cy.get('.graphiql-top-bar-method-toggle').should('have.text', 'GET');

    cy.activateOperation('Read');
    cy.get('[aria-label="Choose operation to run"]').click();
    cy.contains('[role="menuitem"]', 'Change')
      .should('not.have.attr', 'aria-disabled')
      .click();
    cy.wait('@mutation').its('request.method').should('eq', 'POST');
    cy.get('.result-window').should('contain.text', 'MutationType');
    cy.get('.graphiql-top-bar-method-toggle').should('have.text', 'GET');

    cy.get('[aria-label="Run operation"]').should('be.enabled');
    cy.get('.graphiql-query-editor textarea').focus();
    cy.realPress([Cypress.platform === 'darwin' ? 'Meta' : 'Control', 'Enter']);
    cy.wait('@mutation').its('request.method').should('eq', 'POST');
    cy.get('.result-window').should('contain.text', 'MutationType');
    cy.get('.graphiql-top-bar-method-toggle').should('have.text', 'GET');
    cy.then(() =>
      expect(mutationMethods).to.deep.equal(['POST', 'POST', 'POST']),
    );
  });
});
