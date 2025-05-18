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
      // TODO monaco, check why we need to type something
      // cy.get('.graphiql-query-editor textarea').type(' ', {
      //   force: true,
      // });
      cy.get('.monaco-editor').should('have.length', 4);
      cy.clickExecuteQuery();
      cy.assertQueryResult(mockSubscriptionSuccess);
    });
  });
});
