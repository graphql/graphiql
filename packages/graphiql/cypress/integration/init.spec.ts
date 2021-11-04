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
    cy.assertQueryResult({ query: testQuery }, mockSuccess);
  });
  it('Shows the expected error when the schema is invalid', () => {
    cy.visit(`/?bad=true`);
    cy.assertResult({
      errors: [
        {
          message:
            'Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ but "<img src=x onerror=alert(document.domain)>" does not.',
        },
      ],
    });
  });
});
