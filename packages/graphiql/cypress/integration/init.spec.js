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
  it('Renders without error', () => {
    const containers = [
      '#graphiql',
      '.graphiql-container',
      '.topBarWrap',
      '.editorWrap',
      '.queryWrap',
      '.resultWrap',
      '.variable-editor',
    ];
    cy.visit(`/?query=${testQuery}`);
    containers.forEach(cSelector => cy.get(cSelector).should('be.visible'));
  });

  it('Executes a GraphQL query over HTTP that has the expected result', () => {
    cy.get('.execute-button').click();
    cy.wait(3000);
    cy.window().then(w => {
      const result = w.g.resultComponent.viewer.getValue();
      if (result) {
        cy.expect(JSON.parse(result)).to.deep.equal(mockSuccess);
      } else {
        throw Error('result not received');
      }
    });
  });

  it('Toggles doc pane back on', () => {
    cy.get('.docExplorerShow').click();
    cy.get('.doc-explorer').should('be.visible');
  });

  it('Toggles doc pane off', () => {
    // there are two components with .docExplorerHide, one in query history
    cy.get('.docExplorerWrap button.docExplorerHide').click();
    cy.get('.doc-explorer').should('not.exist');
  });
});
