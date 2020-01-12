// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//

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

Cypress.Commands.add('assertQueryResult', (op, mockSuccess) => {
  cy.visitWithOp(op);
  cy.clickExecuteQuery();
  cy.wait(200);
  cy.window().then(w => {
    cy.expect(JSON.parse(w.g.resultComponent.viewer.getValue())).to.deep.equal(
      mockSuccess,
    );
  });
});
