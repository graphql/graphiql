const DEFAULT_HEADERS = '{"foo":2}';

describe('Headers', () => {
  it('should have default query only on first tab and default headers in all tabs', () => {
    cy.visit(`?defaultQuery={test}&defaultHeaders=${DEFAULT_HEADERS}`);
    cy.assertHasValues({ query: '{test}', headersString: DEFAULT_HEADERS });
    cy.get('.graphiql-tab-add').click();
    cy.assertHasValues({ query: '', headersString: DEFAULT_HEADERS });
    cy.get('.graphiql-tab-add').click();
    cy.assertHasValues({ query: '', headersString: DEFAULT_HEADERS });
  });
});
