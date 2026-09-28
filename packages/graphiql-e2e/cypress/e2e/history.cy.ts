import {
  mockQuery1,
  mockVariables1,
  mockBadQuery,
  mockQuery2,
  mockVariables2,
  mockHeaders1,
  mockHeaders2,
} from '../fixtures/fixtures';

const historyItem = (label: string) =>
  cy
    .contains('.graphiql-history-item-label', new RegExp(`^${label}$`))
    .parents('.graphiql-history-item');

describe('history', () => {
  it('will save history item even when history panel is closed', () => {
    cy.visitGraphiQL({ query: '{test}' });
    cy.clickExecuteQuery();
    cy.showPlugin('History');
    cy.get('ul.graphiql-history-items').should('have.length', 1);
    cy.get('ul.graphiql-history-items li').should('have.length', 1);
  });

  it('will not save invalid queries', () => {
    cy.visitGraphiQL({ query: mockBadQuery });
    cy.showPlugin('History');
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 0);
  });

  it('will save if new query is different than previous query', () => {
    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.showPlugin('History');
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visitGraphiQL({ query: mockQuery2, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
  });

  it('will not save if new query is the same as previous query', () => {
    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.showPlugin('History');
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);
  });

  it('will save query if the variables change', () => {
    cy.visitGraphiQL({
      query: mockQuery1,
      headers: mockHeaders1,
      variables: mockVariables1,
    });
    cy.showPlugin('History');
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visitGraphiQL({
      query: mockQuery1,
      headers: mockHeaders1,
      variables: mockVariables2,
    });
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
  });

  it('will save query if the headers change', () => {
    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.showPlugin('History');
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders2 });
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
  });

  it('should remove individual item', () => {
    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.visitGraphiQL({ query: mockQuery2, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.showPlugin('History');

    cy.get('ul.graphiql-history-items li').should('have.length', 2);

    historyItem('Test')
      .find('button[aria-label="Delete from history"]')
      .click();
    cy.get('.graphiql-history-item').should('have.length', 1);
  });

  it('should remove all items', () => {
    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.visitGraphiQL({ query: mockQuery2, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.showPlugin('History');
    cy.get('ul.graphiql-history-items li').should('have.length', 2);

    cy.contains('button', /^Clear$/).click();
    cy.get('.graphiql-history-item').should('have.length', 0);
  });

  it('should add/remove item to favorite', () => {
    cy.visitGraphiQL({ query: mockQuery1, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.visitGraphiQL({ query: mockQuery2, headers: mockHeaders1 });
    cy.clickExecuteQuery();
    cy.showPlugin('History');
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
    historyItem('Test2').should('exist');

    historyItem('Test').find('button[aria-label="Add favorite"]').click();
    cy.get('.graphiql-history ul').should('have.length', 2); // favorites and items
    historyItem('Test')
      .find('button[aria-label="Remove favorite"]')
      .should('exist');
    historyItem('Test2')
      .find('button[aria-label="Add favorite"]')
      .should('exist');

    historyItem('Test').find('button[aria-label="Remove favorite"]').click();
    cy.get('.graphiql-history ul').should('have.length', 1); // just items
    cy.get('.graphiql-history-item').should('have.length', 2);
  });
});
