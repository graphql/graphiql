describe('IncrementalDelivery support via fetcher', () => {
  describe('When operation contains @stream', () => {
    const testSubscription =
      'subscription TestSubscription($delay: Int) { message(delay: $delay) }';
    const mockSubscriptionSuccess = {
      data: {
        message: 'Zdravo',
      },
    };

    it('Expects a subscription to resolve', () => {
      cy.visitWithOp({ query: testSubscription, variables: { delay: 0 } });
      cy.get('.monaco-editor').should('have.length', 4);
      cy.clickExecuteQuery();
      cy.assertQueryResult(mockSubscriptionSuccess);
    });
  });
});
