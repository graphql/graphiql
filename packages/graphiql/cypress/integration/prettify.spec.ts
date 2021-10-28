const prettifiedQuery = `{
  longDescriptionType {
    id
  }
}`;

const prettifiedVariables = `{
  "a": 1
}`;

const uglyQuery = `{longDescriptionType {id}}`;

const uglyVariables = `{"a": 1}`;

const brokenQuery = `longDescriptionType {id}}`;

const brokenVariables = `"a": 1}`;

describe('GraphiQL Prettify', () => {
  it('Regular prettification', () => {
    cy.visitWithOp({ query: uglyQuery, variablesString: uglyVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: prettifiedQuery,
        variablesString: prettifiedVariables,
      });
    });
  });

  it('Noop prettification', () => {
    cy.visitWithOp({
      query: prettifiedQuery,
      variablesString: prettifiedVariables,
    });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: prettifiedQuery,
        variablesString: prettifiedVariables,
      });
    });
  });

  it('No crash on bad query', () => {
    cy.visitWithOp({ query: brokenQuery, variablesString: uglyVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: brokenQuery,
        variablesString: prettifiedVariables,
      });
    });
  });

  it('No crash on bad variablesString', () => {
    cy.visitWithOp({ query: uglyQuery, variablesString: brokenVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: prettifiedQuery,
        variablesString: brokenVariables,
      });
    });
  });
});
