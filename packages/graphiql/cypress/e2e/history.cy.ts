describe('History', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win: Cypress.AUTWindow) {
        win.localStorage.setItem(
          'graphiql:queries',
          JSON.stringify({
            queries: [
              { query: 'query one { isTest }', operationName: 'one' },
              { query: 'query two { isTest }', operationName: 'two' },
              { query: 'query three { isTest }', operationName: 'three' },
            ],
          }),
        );
      },
    });
    cy.get('[aria-label="Show History"]').click();
  });

  it('should have history items', () => {
    cy.get('.graphiql-history-item-label').eq(0).should('have.text', 'three');
    cy.get('.graphiql-history-item-label').eq(1).should('have.text', 'two');
    cy.get('.graphiql-history-item-label').eq(2).should('have.text', 'one');
  });

  it('should remove individual item', () => {
    cy.get('.graphiql-history-item:nth-child(2) > button[aria-label="Delete from history"]').click();
    cy.get('.graphiql-history-item').should('have.length', 2);
  });

  it('should remove all items', () => {
    cy.get('.graphiql-history-header > button:last-child').click();
    cy.get('.graphiql-history-item').should('have.length', 0);
  });

  it('should add/remove item to favorite', () => {
    cy.get('.graphiql-history-item:nth-child(3) > button[aria-label="Add favorite"]').click();
    cy.get('.graphiql-history-item').should('have.length', 4);
    cy.get('.graphiql-history-item-label').eq(0).should('have.text', 'one');
    cy.get('.graphiql-history-item-label').eq(3).should('have.text', 'one');
    cy.get('.graphiql-history-item:nth-child(1) > button[aria-label="Remove favorite"]').click();
    cy.get('.graphiql-history-item').should('have.length', 3);
  });
});
