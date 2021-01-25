// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// / <reference types="cypress" />

declare namespace Cypress {
  type Op = {
    query: string;
    variables?: string;
  };
  type MockResult =
    | {
        data: any;
      }
    | { error: any[] };
  interface Chainable<Subject = any> {
    /**
     * Custom command to select DOM element by data-cy attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>;
    getCy(cyName: string): Chainable<Element>;
    clickExecuteQuery(): Chainable<Element>;
    visitWithOp(op: Op): Chainable<Element>;
    clickPrettify(): Chainable<Element>;
    assertHasValues(op: Op): Chainable<Element>;
    assertQueryResult(
      op: Op,
      expectedResult: MockResult,
      timeout?: number,
    ): Chainable<Element>;
  }
}

Cypress.Commands.add('getCy', cyName => {
  return cy.get(`[data-cy=${cyName}]`);
});

Cypress.Commands.add('clickExecuteQuery', () => {
  return cy.get('.execute-button').click();
});

Cypress.Commands.add('clickPrettify', () => {
  return cy.get('[title="Prettify Query (Shift-Ctrl-P)"]').click();
});

Cypress.Commands.add('visitWithOp', ({ query, variables }) => {
  let url = `/?query=${encodeURIComponent(query)}`;
  if (variables) {
    url += `&variables=${encodeURIComponent(variables)}`;
  }
  return cy.visit(url);
});

Cypress.Commands.add('assertHasValues', ({ query, variables }) => {
  cy.window().then(w => {
    // @ts-ignore
    expect(w.g.getQueryEditor().getValue()).to.equal(query);
    if (variables) {
      // @ts-ignore
      expect(w.g.getVariableEditor().getValue()).to.equal(variables);
    }
  });
});

Cypress.Commands.add('assertQueryResult', (op, mockSuccess, timeout = 200) => {
  cy.visitWithOp(op);
  cy.clickExecuteQuery();
  cy.wait(timeout);
  cy.window().then(w => {
    // @ts-ignore
    const value = w.g.resultComponent.viewer.getValue();
    expect(value).to.deep.equal(JSON.stringify(mockSuccess, null, 2));
  });
});
