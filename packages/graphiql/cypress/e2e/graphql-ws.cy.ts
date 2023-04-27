describe('IncrementalDelivery support via fetcher', () => {
  describe('When operation contains @stream', () => {
    const testSubscription = /* GraphQL */ `
      subscription TestSubscription($delay: Int) {
        message(delay: $delay)
      }
    `;
    const mockSubscriptionSuccess = {
      data: {
        message: 'Zdravo',
      },
    };

    it('Expects a subscription to resolve', () => {
      cy.visitWithOp({ query: testSubscription, variables: { delay: 0 } });
      cy.clickExecuteQuery();
      cy.assertQueryResult(mockSubscriptionSuccess);
    });
  });
});
