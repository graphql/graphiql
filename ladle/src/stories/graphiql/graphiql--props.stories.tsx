import { createGraphiQLFetcher } from '../../../../packages/graphiql-toolkit';
import { GraphiQL } from '../../../../packages/graphiql';
import { testSchema } from '../../utils/testSchema';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

export const DefaultQuery = () => {
  return <GraphiQL defaultQuery="GraphQL Party!!" fetcher={fetcher} />;
};

export const Schema = () => {
  return <GraphiQL schema={testSchema} fetcher={fetcher} />;
};
