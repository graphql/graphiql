/* eslint-disable */
// @ts-nocheck

const variable = 'test';

gql`
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;

graphql`
  query {
    user(id: "5", name: boolean) {
      something
    }
  }
`;

const graphql = graphql`
  query {
    user(id: "5", name: ${variable}) {
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

// TODO: fix this
const queryWithLeadingAboveComment =
  /* GraphQL */
  `
    query {
      user(id: "5", name: boolean) {
        something
      }
    }
  `;
