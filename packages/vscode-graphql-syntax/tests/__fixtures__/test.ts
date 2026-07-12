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

const query = graphql<Generic>('query { id }');

const nestedQuery = graphql<Result<User>>('query { id }');

const nestedTaggedQuery = graphql<Result<User>>`query { id }`;

const quotedGenericQuery = graphql<{ operator: '>' }>('query { id }');

const afterQuotedGeneric = 'after';

const query = graphql('query { id }');

const query = graphql<Generic>('query { id }');

const query = graphql(`
  query {
    id
  }
`);

const query = graphql(
  `
    query {
      id
    }
  `,
  [var1, var2],
);

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

const response = await client.graphql<Response>(graphql, { issue });

client. graphql<Response>(graphql, { issue });

client./* comment */graphql<Response>(graphql, { issue });

if (response) {
  const afterAmplify = true;
}

foo.graphql();

const afterMember = 'after';

graphql.experimental(`query { id }`);

obj.graphql.experimental(`query { id }`);

const afterExperimental = true;
