import { version } from 'graphql';

let describeOrSkip = describe.skip;

// hard to account for the extra \n between 15/16 so these only run for 16 for now
if (parseInt(version, 10) > 15) {
  describeOrSkip = describe;
}

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

describeOrSkip('GraphiQL Prettify', () => {
  it('should work while click on prettify button', async () => {
    const rawQuery = '{  test\n\nid  }';
    const resultQuery = '{ test id }';
    cy.visit(`?query=${rawQuery}&onPrettifyQuery=true`);
    await cy.clickPrettify();
    cy.assertHasValues({ query: resultQuery });
  });

  it('Regular prettification', async () => {
    cy.visitWithOp({ query: uglyQuery, variablesString: uglyVariables });

    await cy.clickPrettify();

    cy.assertHasValues({
      query: prettifiedQuery,
      variablesString: prettifiedVariables,
    });
  });

  it('Noop prettification', async () => {
    cy.visitWithOp({
      query: prettifiedQuery,
      variablesString: prettifiedVariables,
    });

    await cy.clickPrettify();

    cy.assertHasValues({
      query: prettifiedQuery,
      variablesString: prettifiedVariables,
    });
  });

  it('No crash on bad query', async () => {
    cy.visitWithOp({ query: brokenQuery, variablesString: uglyVariables });

    await cy.clickPrettify();

    cy.assertHasValues({
      query: brokenQuery,
      variablesString: prettifiedVariables,
    });
  });

  it('No crash on bad variablesString', async () => {
    cy.visitWithOp({ query: uglyQuery, variablesString: brokenVariables });

    await cy.clickPrettify();

    cy.assertHasValues({
      query: prettifiedQuery,
      variablesString: brokenVariables,
    });
  });
});
