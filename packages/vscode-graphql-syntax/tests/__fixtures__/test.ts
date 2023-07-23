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

const graphql = graphql<SomeGeneric>`
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;

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
