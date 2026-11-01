/**
 * The E2E app in `packages/graphiql-e2e/src/e2e.ts` uses `createTransport` and the
 * `<GraphiQL transport={...}>` prop. These tests confirm that the response pane
 * header shows real wire metadata from the actual HTTP response (status code,
 * method, timing, response size) and that the upgrade banner is NOT shown because
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

  it('Shows the actual POST method and the joined method control', () => {
    cy.visitGraphiQL({ query: testQuery });
    cy.clickExecuteQuery();
    cy.get('.graphiql-response-method').should('have.text', 'POST');
    cy.get('.graphiql-execute-button-method-label').should('have.text', 'POST');
    cy.get('[aria-label="Choose request method"]').should(
      'not.contain.text',
      'Auto',
    );
    cy.get('.graphiql-top-bar-method-toggle').should('not.exist');
    cy.get('.graphiql-top-bar-method-label').should('not.exist');
  });

  it('Discovers a GET-only endpoint and displays the actual GET method', () => {
    cy.intercept('OPTIONS', '/graphql', {
      statusCode: 204,
      headers: { Allow: 'GET' },
    }).as('discovery');
    cy.intercept('GET', '/graphql*', request => {
      if (new URL(request.url).searchParams.get('operationName') === 'Read') {
        request.alias = 'read';
      }
    });
    cy.visitGraphiQL({ query: 'query Read { __typename }' });
    cy.wait('@discovery');
    cy.clickExecuteQuery();
    cy.wait('@read').its('request.method').should('eq', 'GET');
    cy.get('.graphiql-response-method').should('have.text', 'GET');
    cy.get('.graphiql-execute-button-method-label').should('have.text', 'GET');
    cy.get('[aria-label="Choose request method"]').click();
    cy.contains('[role="menuitemradio"]', /^POST$/).should(
      'have.attr',
      'aria-disabled',
      'true',
    );
    cy.contains('[role="menuitemradio"]', /^QUERY$/)
      .should('have.attr', 'aria-disabled', 'true')
      .realHover();
    cy.get('[role="tooltip"]').should(
      'contain.text',
      'This server does not support QUERY.',
    );
    cy.realPress('Escape');
    cy.get('.result-window').should('contain.text', '__typename');
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
  it('executes mutations through POST after selection, from the button and shortcut', () => {
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
    cy.activateOperation('Change');

    cy.get('[aria-label="Run operation"]').should('be.enabled').click();
    cy.wait('@mutation').its('request.method').should('eq', 'POST');
    cy.get('.result-window').should('contain.text', 'MutationType');
    cy.get('.graphiql-response-method').should('have.text', 'POST');

    cy.activateOperation('Read');
    cy.get('[aria-label="Choose operation to run"]').click();
    cy.contains('[role="menuitemradio"]', 'Change')
      .should(item => {
        expect(item).not.to.have.attr('aria-disabled');
      })
      .click();
    cy.get('[aria-label="Choose operation to run"]').should(
      'contain.text',
      'Change',
    );
    cy.then(() => expect(mutationMethods).to.deep.equal(['POST']));
    cy.get('[aria-label="Run operation"]').click();
    cy.wait('@mutation').its('request.method').should('eq', 'POST');
    cy.get('.result-window').should('contain.text', 'MutationType');
    cy.get('.graphiql-response-method').should('have.text', 'POST');

    cy.activateOperation('Change');
    cy.get('[aria-label="Run operation"]').should('be.enabled');
    cy.get('.graphiql-query-editor textarea').focus();
    cy.realPress([Cypress.platform === 'darwin' ? 'Meta' : 'Control', 'Enter']);
    cy.wait('@mutation').its('request.method').should('eq', 'POST');
    cy.get('.result-window').should('contain.text', 'MutationType');
    cy.get('.graphiql-response-method').should('have.text', 'POST');
    cy.then(() =>
      expect(mutationMethods).to.deep.equal(['POST', 'POST', 'POST']),
    );
  });
});

describe('Joined Run method selection', () => {
  it('keeps a query override across mutations and can return to Auto', () => {
    const executions: Array<{ name: string; method: string }> = [];
    cy.intercept('OPTIONS', '/graphql', {
      statusCode: 204,
      headers: { Allow: 'GET, POST' },
    }).as('methodDiscovery');
    cy.intercept('/graphql*', request => {
      const name =
        request.method === 'GET'
          ? new URL(request.url).searchParams.get('operationName')
          : request.body?.operationName;
      if (name === 'Read' || name === 'Change') {
        executions.push({ name, method: request.method });
        request.alias = 'selectedOperation';
      }
    });
    cy.visitGraphiQL({
      query: 'query Read { __typename }\nmutation Change { __typename }\n',
    });
    cy.wait('@methodDiscovery');
    cy.activateOperation('Read');
    cy.get('[aria-label="Choose request method"]')
      .should('contain.text', 'POST')
      .and('not.contain.text', 'Auto')
      .click();
    cy.contains('[role="menuitemradio"]', /^Auto$/).should(
      'have.attr',
      'aria-checked',
      'true',
    );
    cy.contains('[role="menuitemradio"]', /^GET$/).click();
    cy.get('[aria-label="Choose request method"]')
      .should('contain.text', 'GET')
      .and('not.contain.text', 'Auto');
    cy.clickExecuteQuery();
    cy.wait('@selectedOperation').its('request.method').should('equal', 'GET');

    cy.activateOperation('Change');
    cy.get('.graphiql-execute-button').should('contain.text', 'POST');
    cy.get('[aria-label="Choose request method"]').click();
    cy.contains('[role="menuitemradio"]', /^GET$/)
      .should('have.attr', 'aria-disabled', 'true')
      .realHover();
    cy.get('[role="tooltip"]').should(
      'contain.text',
      'GET is not supported for mutations.',
    );
    cy.contains('[role="menuitemradio"]', /^GET$/).click();
    cy.get('[role="menu"]').should('be.visible');
    cy.realPress('Escape');
    cy.clickExecuteQuery();
    cy.wait('@selectedOperation').its('request.method').should('equal', 'POST');

    cy.activateOperation('Read');
    cy.get('[aria-label="Choose request method"]')
      .should('contain.text', 'GET')
      .click();
    cy.contains('[role="menuitemradio"]', /^Auto/).click();
    cy.get('[aria-label="Choose request method"]')
      .should('contain.text', 'POST')
      .and('not.contain.text', 'Auto');
    cy.clickExecuteQuery();
    cy.wait('@selectedOperation').its('request.method').should('equal', 'POST');
    cy.then(() =>
      expect(executions).to.deep.equal([
        { name: 'Read', method: 'GET' },
        { name: 'Change', method: 'POST' },
        { name: 'Read', method: 'POST' },
      ]),
    );
  });
});
