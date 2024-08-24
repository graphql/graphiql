describe('IncrementalDelivery support via fetcher', () => {
  function assertResponse() {
    for (const message of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
      cy.assertQueryResult({ data: { message } });
    }
  }

  it('should work with ws', () => {
    const testSubscription = /* GraphQL */ `
      subscription TestSubscription {
        message
      }
    `;

    cy.visit(`/?query=${testSubscription}`);
    cy.clickExecuteQuery();
    assertResponse();
  });

  it('should work with sse', () => {
    const testSubscription = /* GraphQL */ `
      subscription Test {
        message
      }
    `;

    cy.visit(
      `/?sseUrl=http://localhost:8080/graphql/stream&query=${testSubscription}`,
    );
    cy.clickExecuteQuery();
    assertResponse();
  });
});
