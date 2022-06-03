/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

const prettifiedQuery = `{
  longDescriptionType {
    id
  }
}
`;

const prettifiedVariables = `{
  "a": 1
}`;

const uglyQuery = `{longDescriptionType {id}}`;

const uglyVariables = `{"a": 1}`;

const brokenQuery = `longDescriptionType {id}}`;

const brokenVariables = `"a": 1}`;

describe('GraphiQL Prettify', () => {
  it('Regular prettification', () => {
    cy.visitWithOp({ query: uglyQuery, variables: uglyVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(prettifiedQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(
        prettifiedVariables,
      );
    });
  });

  it('Noop prettification', () => {
    cy.visitWithOp({ query: prettifiedQuery, variables: prettifiedVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(prettifiedQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(
        prettifiedVariables,
      );
    });
  });

  it('No crash on bad query', () => {
    cy.visitWithOp({ query: brokenQuery, variables: uglyVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(brokenQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(
        prettifiedVariables,
      );
    });
  });

  it('No crash on bad variables', () => {
    cy.visitWithOp({ query: uglyQuery, variables: brokenVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(prettifiedQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(brokenVariables);
    });
  });
});
