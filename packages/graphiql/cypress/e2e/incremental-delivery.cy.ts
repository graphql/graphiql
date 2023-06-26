import { version } from 'graphql';

let describeOrSkip = describe.skip;

// TODO: disable when defer/stream is merged to graphql
if (version.includes('stream')) {
  describeOrSkip = describe;
}

describeOrSkip('IncrementalDelivery support via fetcher', () => {
  describe('When operation contains @stream', () => {
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

    it('Expects slower streams to resolve in several increments, and the payloads to patch properly', () => {
      const delay = 100;
      const timeout = mockStreamSuccess.data.streamable.length * (delay * 1.5);

      cy.visitWithOp({ query: testStreamQuery, variables: { delay } });
      cy.clickExecuteQuery();
      cy.wait(timeout);
      cy.assertQueryResult(mockStreamSuccess);
    });

    it('Expects a quick stream to resolve in a single increment', () => {
      cy.visitWithOp({ query: testStreamQuery, variables: { delay: 0 } });
      cy.clickExecuteQuery();
      cy.assertQueryResult(mockStreamSuccess);
    });
  });

  describe('When operating with @defer', () => {
    it('Excepts to see a slow response but path properly', () => {
      const delay = 1000;
      const timeout = delay * 1.5;

      const testQuery = /* GraphQL */ `
        query DeferQuery($delay: Int) {
          deferrable {
            normalString
            ... @defer {
              deferredString(delay: $delay)
            }
          }
        }
      `;

      cy.visitWithOp({ query: testQuery, variables: { delay } });
      cy.clickExecuteQuery();
      cy.wait(timeout);
      cy.assertQueryResult({
        data: {
          deferrable: {
            normalString: 'Nice',
            deferredString:
              'Oops, this took 1 seconds longer than I thought it would!',
          },
        },
        hasNext: false,
      });
    });

    it('Expects to merge types when members arrive at different times', () => {
      /*
      This tests that;
      1. user ({name}) => { name }
      2. user ({age}) => { name, age }
      3. user.friends.0 ({name}) => { name, age, friends: [{name}] } <- can sometimes happen before 4, due the the promise race
      4. user.friends.0 ({age}) => { name, age, friends: [{name, age}] }

      This shows us that we can deep merge defers, deep merge streams, and also deep merge defers inside streams
       */

      const delay = 1000;
      const timeout = 4 /* friends */ * (delay * 1.5);

      const testQuery = /* GraphQL */ `
        query DeferQuery($delay: Int) {
          person {
            name
            ... @defer {
              age(delay: $delay)
            }
            friends @stream(initialCount: 0) {
              ... @defer {
                name
              }
              ... @defer {
                age(delay: $delay)
              }
            }
          }
        }
      `;

      cy.visitWithOp({ query: testQuery, variables: { delay } });
      cy.clickExecuteQuery();
      cy.wait(timeout);
      cy.assertQueryResult({
        data: {
          person: {
            name: 'Mark',
            friends: [
              {
                name: 'James',
                age: 1000,
              },
              {
                name: 'Mary',
                age: 1000,
              },
              {
                name: 'John',
                age: 1000,
              },
              {
                name: 'Patrica',
                age: 1000,
              },
            ],
            age: 1000,
          },
        },
        hasNext: false,
      });
    });
  });
});
