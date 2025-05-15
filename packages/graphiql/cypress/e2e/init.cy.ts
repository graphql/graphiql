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
      '.graphiql-editors',
      '.graphiql-response',
      '.graphiql-editor-tool',
    ];
    cy.visit('/');
    cy.get('.graphiql-query-editor').contains('# Welcome to GraphiQL');
    for (const cSelector of containers) {
      cy.get(cSelector).should('be.visible');
    }
  });

  it('Executes a GraphQL query over HTTP that has the expected result', () => {
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    cy.assertQueryResult(mockSuccess);
  });
  it('Shows the expected error when the schema is invalid', () => {
    cy.intercept('/graphql', { fixture: 'bad-schema.json' });
    cy.visit('/');
    cy.get('section.result-window').should(element => {
      expect(element.get(0).innerText).to.contain('Names must');
    });
  });
});
