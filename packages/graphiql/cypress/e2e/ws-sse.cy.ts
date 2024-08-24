describe('IncrementalDelivery support via fetcher', () => {
  const testSubscription = /* GraphQL */ `
    subscription Test {
      message
    }
  `;

  function assertResponse() {
    for (const message of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
      cy.assertQueryResult({ data: { message } });
    }
  }

  it('should work with ws', () => {
    cy.visit(`/?query=${testSubscription}`);
    cy.clickExecuteQuery();
    assertResponse();
  });

  it('should work with sse', () => {
    cy.visit(
      `/?sseUrl=http://localhost:8080/graphql/stream&query=${testSubscription}`,
    );
    cy.clickExecuteQuery();
    assertResponse();
  });
});
