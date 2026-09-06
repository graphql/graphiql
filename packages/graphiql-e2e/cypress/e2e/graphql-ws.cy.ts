describe('IncrementalDelivery support via fetcher', () => {
  describe('When operation contains @stream', () => {
    const testSubscription =
      'subscription TestSubscription($delay: Int) { message(delay: $delay) }';
    const mockSubscriptionSuccess = {
      data: {
        message: 'Zdravo',
      },
    };

    it('Uses the page origin for subscriptions', () => {
      let socketUrl: string | undefined;
      const query = encodeURIComponent(testSubscription);
      const variables = encodeURIComponent(JSON.stringify({ delay: 0 }));

      cy.visit(`?query=${query}&variables=${variables}`, {
        onBeforeLoad(win) {
          const NativeWebSocket = win.WebSocket;
          const ObservedWebSocket = new Proxy(NativeWebSocket, {
            construct(Target, args) {
              socketUrl = String(args[0]);
              return Reflect.construct(Target, args);
            },
          });
          Object.defineProperty(win, 'WebSocket', {
            configurable: true,
            value: ObservedWebSocket,
          });
        },
      });
      cy.get('.monaco-editor').should('have.length', 4);
      cy.clickExecuteQuery();
      cy.location().then(({ protocol, host }) => {
        const socketProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        cy.window().should(() => {
          expect(socketUrl).to.equal(
            `${socketProtocol}//${host}/subscriptions`,
          );
        });
      });
      cy.assertQueryResult(mockSubscriptionSuccess);
    });
  });
});
