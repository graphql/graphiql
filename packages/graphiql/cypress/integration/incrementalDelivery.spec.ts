const testStreamQuery = /* GraphQL */ `
  {
    streamable @stream(initialCount: 2) {
      text
    }
  }
`;

const mockStreamSuccess = {
  data: {
    streamable: [
      {
        text: 'Hi',
      },
      {
        text: '你好',
      },
      {
        text: 'Hola',
      },
      {
        text: 'سلام',
      },
      {
        text: 'Bonjour',
      },
      {
        text: '안녕',
      },
      {
        text: 'Ciao',
      },
      {
        text: 'हेलो',
      },
      {
        text: 'Здорово',
      },
    ],
  },
};

describe('IncrementalDelivery support via fetcher', () => {
  it('Executes a GraphQL query over HTTP that has the expected result', () => {
    cy.visit(`/?query=${testStreamQuery}`);
    cy.assertQueryResult({ query: testStreamQuery }, mockStreamSuccess, 3000);
  });
});
