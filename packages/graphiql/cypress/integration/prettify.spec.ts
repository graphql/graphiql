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
      cy.assertHasValues({
        query: prettifiedQuery,
        variables: prettifiedVariables,
      });
    });
  });

  it('Noop prettification', () => {
    cy.visitWithOp({ query: prettifiedQuery, variables: prettifiedVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: prettifiedQuery,
        variables: prettifiedVariables,
      });
    });
  });

  it('No crash on bad query', () => {
    cy.visitWithOp({ query: brokenQuery, variables: uglyVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: brokenQuery,
        variables: prettifiedVariables,
      });
    });
  });

  it('No crash on bad variables', () => {
    cy.visitWithOp({ query: uglyQuery, variables: brokenVariables });

    cy.clickPrettify();

    cy.window().then(w => {
      cy.assertHasValues({
        query: prettifiedQuery,
        variables: brokenVariables,
      });
    });
  });
});
