const testStreamQuery = /* GraphQL */ `
  query StreamQuery($delay: Int) {
    streamable(delay: $delay) @stream(initialCount: 2) {
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
        text: 'أهلاً',
      },
      {
        text: 'Bonjour',
      },
      {
        text: 'سلام',
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
  hasNext: false,
};

const testDeferQuery = /* GraphQL */ `
  query DeferQuery($delay: Int) {
    streamable(delay: $delay) @stream(initialCount: 2) {
      text
    }
  }
`;

describe('IncrementalDelivery support via fetcher', () => {
  it('Expects slower streams to resolve in several increments, and the payloads to patch properly', () => {
    const delay = 100;
    const timeout = mockStreamSuccess.data.streamable.length * (delay * 1.5);

    cy.visit(`/?query=${testStreamQuery}`);
    cy.assertQueryResult(
      { query: testStreamQuery, variables: { delay } },
      mockStreamSuccess,
      timeout,
    );
  });
  it('Expects a quick stream to resolve in a single increment', () => {
    cy.visit(`/?query=${testStreamQuery}`);
    cy.assertQueryResult(
      { query: testStreamQuery, variables: { delay: 0 } },
      mockStreamSuccess,
    );
  });
});
