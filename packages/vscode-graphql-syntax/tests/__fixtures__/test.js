/* eslint-disable */
/* prettier-ignore */
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

const graphql = graphql(`
  """ this is a comment """
  query {
    user(id: "5", name: ${variable}) {
      something
    }
  }
`);

const graphql = graphql(
  `
    query { test }
  `,
  [var1, var2]
);

const query = /* GraphQL */ 'query { id } ';
const query = graphql('query { id } ');
const query = graphql(
  'query { id } '
);

const queryWithInlineComment = `#graphql
 query {
        user(id: "5", name: boolean) {
            something
        }
    }
`;

const queryWithInlineComment = '#graphql query { id } ';

const queryWithInlineComment = '#graphql query { id } ';

const queryWithInlineComment = `#graphql
 query {
        user(id: "5", name: boolean) {
            something
        }
    }
`;
const queryWithInlineComment = `
#graphql
 query {
        user(id: "5", name: boolean) {
            something
        }
    }
`;

const queryWithLeadingComment = /* GraphQL */ `
  query {
    """ this is a comment """
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
