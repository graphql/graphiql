/* eslint-disable */
// @ts-nocheck

gql`
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;

graphql<SomeGeneric>`
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;

const query = graphql<SomeGeneric>`
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;

// TODO: Fix this
const query = graphql<Generic>('query { id }');

const queryWithInlineComment = `#graphql
 query {
        user(id: "5", name: boolean) {
            something
        }
    }
`;

const queryWithLeadingComment = /* GraphQL */ `
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;
