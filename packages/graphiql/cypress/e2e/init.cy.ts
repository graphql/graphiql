const testQuery = `{
longDescriptionType {
  id
  image
  hasArgs
  test {
    id
    isTest
    __typename
  }
 }
}`;

const mockSuccess = {
  data: {
    longDescriptionType: {
      id: 'abc123',
      image: '/resources/logo.svg',
      hasArgs: '{"defaultValue":"test default value"}',
      test: {
        id: 'abc123',
        isTest: true,
        __typename: 'Test',
      },
    },
  },
};

describe('GraphiQL On Initialization', () => {
  it('Renders default value without error', () => {
    const containers = [
      '#graphiql',
      '.graphiql-container',
      '.graphiql-sessions',
      '.graphiql-editor-column',
      '.graphiql-editors',
      '.graphiql-response-column',
      '.graphiql-response',
      '.graphiql-editor-tool',
    ];
    cy.visit('/');
    cy.get('.graphiql-query-editor').contains('# Welcome to GraphiQL');
    for (const cSelector of containers) {
      cy.get(cSelector).should('be.visible');
    }
  });

  it('Places the action buttons on the editor side of the split', () => {
    cy.visit('/');
    // The prettify/merge/copy/save buttons belong to the query editor, so they
    // live in the editor column rather than floating over the response pane.
    cy.get('.graphiql-editor-column .graphiql-tab-strip-actions')
      .find('.graphiql-tab-strip-action')
      .should('have.length.at.least', 3);
    cy.get('.graphiql-response-column .graphiql-tab-strip-actions').should(
      'not.exist',
    );
  });

  it('Executes a GraphQL query over HTTP that has the expected result', () => {
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    cy.assertQueryResult(mockSuccess);
  });
  it('Shows the expected error when the schema is invalid', () => {
    cy.intercept('/graphql', { fixture: 'bad-schema.json' });
    cy.visit('/');
    cy.containQueryResult('Names must');
  });
});
