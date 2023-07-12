import {
  mockQuery1,
  mockVariables1,
  mockBadQuery,
  mockQuery2,
  mockVariables2,
  mockHeaders1,
  mockHeaders2,
} from '../fixtures/fixtures';

describe('history', () => {
  beforeEach(() => {});
  it('defaults to closed history panel', () => {
    cy.visit('/');

    cy.get('.graphiql-history').should('not.exist');
  });

  it('will save history item even when history panel is closed', () => {
    cy.visit('/?query={test}');
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items').should('have.length', 1);
  });

  it('will save history item even when history panel is closed', () => {
    cy.visit('/?query={test}');
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);
  });

  it('will not save invalid queries', () => {
    cy.visit(`?query=${mockBadQuery}`);
    cy.get('button[aria-label="Show History"]').click();
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 0);
  });

  it('will save if new query is different than previous query', () => {
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.get('button[aria-label="Show History"]').click();
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visit(`?query=${mockQuery2}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
  });

  it('will not save if new query is the same as previous query', () => {
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.get('button[aria-label="Show History"]').click();
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);
  });

  it('will save query if the variables change', () => {
    cy.visit(
      `?query=${mockQuery1}&headers=${mockHeaders1}&variables=${mockVariables1}`,
    );
    cy.get('button[aria-label="Show History"]').click();
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visit(
      `?query=${mockQuery1}&headers=${mockHeaders1}&variables=${mockVariables2}`,
    );
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
  });

  it('will save query if the headers change', () => {
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.get('button[aria-label="Show History"]').click();
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders2}`);
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
  });

  it('should remove individual item', () => {
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.visit(`?query=${mockQuery2}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();

    cy.get('ul.graphiql-history-items li').should('have.length', 2);

    cy.get(
      '.graphiql-history-item:nth-child(2) > button[aria-label="Delete from history"]',
    ).click();
    cy.get('.graphiql-history-item').should('have.length', 1);
  });

  it('should remove all items', () => {
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.visit(`?query=${mockQuery2}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);

    cy.get('.graphiql-history-header > button:last-child').click();
    cy.get('.graphiql-history-item').should('have.length', 0);
  });

  it('should add/remove item to favorite', () => {
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.visit(`?query=${mockQuery2}&headers=${mockHeaders1}`);
    cy.clickExecuteQuery();
    cy.get('button[aria-label="Show History"]').click();
    cy.get('ul.graphiql-history-items li').should('have.length', 2);
    cy.get('.graphiql-history-item-label').eq(0).should('have.text', 'Test2');

    const favorites =
      '.graphiql-history ul:first-of-type .graphiql-history-item';
    const items = '.graphiql-history ul:last-of-type .graphiql-history-item';

    cy.get(
      '.graphiql-history-item:nth-child(2) > button[aria-label="Add favorite"]',
    ).click();
    cy.get('.graphiql-history ul').should('have.length', 2); // favorites and items
    cy.get(favorites).should('have.length', 1);
    cy.get(items).should('have.length', 1);
    cy.get('.graphiql-history-item-label').eq(0).should('have.text', 'Test'); // favorite so now at top of list

    cy.get(
      '.graphiql-history-item:nth-child(1) > button[aria-label="Remove favorite"]',
    ).click();
    cy.get('.graphiql-history ul').should('have.length', 1); // just items
    cy.get(items).should('have.length', 2);
  });
});
