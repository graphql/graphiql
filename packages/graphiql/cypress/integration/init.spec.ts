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
      image: '/images/logo.svg',
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
      '.topBarWrap',
      '.editorWrap',
      '.graphiql-editors',
      '.graphiql-response',
      '.graphiql-editor-tool',
    ];
    cy.visit(`/`);
    cy.get('.graphiql-query-editor').contains('# Welcome to GraphiQL');
    containers.forEach(cSelector => cy.get(cSelector).should('be.visible'));
  });

  it('Executes a GraphQL query over HTTP that has the expected result', () => {
    cy.visitWithOp({ query: testQuery });
    cy.clickExecuteQuery();
    cy.assertQueryResult(mockSuccess);
  });
  it('Shows the expected error when the schema is invalid', () => {
    cy.visit(`/?bad=true`);
    cy.wait(200);
    cy.get('section.result-window').should(element => {
      expect(element.get(0).innerText).to.contain('Names must');
    });
  });
});
