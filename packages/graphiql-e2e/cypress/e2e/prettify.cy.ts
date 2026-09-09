const prettifiedQuery = `{
  longDescriptionType {
    id
  }
}`;

const prettifiedVariables = `{
  "a": 1
}`;

const uglyQuery = '{longDescriptionType {id}}';

const uglyVariables = '{"a": 1}';

const brokenQuery = 'longDescriptionType {id}}';

const brokenVariables = '"a": 1}';

describe('GraphiQL Prettify', () => {
  it('should work while click on prettify button', () => {
    const rawQuery = '{  test\n\nid  }';
    const resultQuery = '{ test id }';
    cy.visitGraphiQL({ query: rawQuery, onPrettifyQuery: 'true' });
    cy.clickPrettify();
    cy.assertHasValues({ query: resultQuery });
  });

  it('Regular prettification', () => {
    cy.visitGraphiQL({ query: uglyQuery, variables: uglyVariables });

    cy.clickPrettify();

    cy.assertHasValues({
      query: prettifiedQuery,
      variablesString: prettifiedVariables,
    });
  });

  it('Noop prettification', () => {
    cy.visitGraphiQL({
      query: prettifiedQuery,
      variables: prettifiedVariables,
    });

    cy.clickPrettify();

    cy.assertHasValues({
      query: prettifiedQuery,
      variablesString: prettifiedVariables,
    });
  });

  it('No crash on bad query', () => {
    cy.visitGraphiQL({ query: brokenQuery, variables: uglyVariables });

    cy.clickPrettify();

    cy.assertHasValues({
      query: brokenQuery,
      variablesString: prettifiedVariables,
    });
  });

  it('No crash on bad variablesString', () => {
    cy.visitGraphiQL({ query: uglyQuery, variables: brokenVariables });

    cy.clickPrettify();

    cy.assertHasValues({
      query: prettifiedQuery,
      variablesString: brokenVariables,
    });
  });
});
