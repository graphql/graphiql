const DEFAULT_HEADERS = '{"foo":2}';

describe('Headers', () => {
  describe('`defaultHeaders`', () => {
    it('should have default headers while open new tabs', () => {
      cy.visit(`/?query={test}&defaultHeaders=${DEFAULT_HEADERS}`);
      cy.assertHasValues({ query: '{test}', headersString: DEFAULT_HEADERS });
      cy.get('.graphiql-tab-add').click();
      cy.assertHasValues({ query: '', headersString: DEFAULT_HEADERS });
      cy.get('.graphiql-tab-add').click();
      cy.assertHasValues({ query: '', headersString: DEFAULT_HEADERS });
    });

    it('if `headers` and `defaultHeaders` are set, `headers` should be on 1st tab and `defaultHeaders` for other opened tabs', () => {
      const HEADERS = '{"bar":true}';
      cy.visit(
        `/?query={test}&defaultHeaders=${DEFAULT_HEADERS}&headers=${HEADERS}`,
      );
      cy.assertHasValues({ query: '{test}', headersString: HEADERS });
      cy.get('.graphiql-tab-add').click();
      cy.assertHasValues({ query: '', headersString: DEFAULT_HEADERS });
      cy.get('.graphiql-tab-add').click();
      cy.assertHasValues({ query: '', headersString: DEFAULT_HEADERS });
    });
  });
});
