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
  beforeEach(() => {

  });
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
    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}&variables=${mockVariables1}`);
    cy.get('button[aria-label="Show History"]').click();
    cy.clickExecuteQuery();
    cy.get('ul.graphiql-history-items li').should('have.length', 1);

    cy.visit(`?query=${mockQuery1}&headers=${mockHeaders1}&variables=${mockVariables2}`);
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

});
