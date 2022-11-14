import { createGraphiQLFetcher } from '../../../../packages/graphiql-toolkit';
import { GraphiQL } from '../../../../packages/graphiql';

export const GraphiQLSWAPI = () => {
  return (
    <GraphiQL
      fetcher={createGraphiQLFetcher({
        url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
      })}
    />
  );
};

GraphiQLSWAPI.storyName = 'SWAPI';

export const GraphiQLSpaceX = () => {
  return (
    <GraphiQL
      fetcher={createGraphiQLFetcher({
        url: 'https://api.spacex.land/graphql',
      })}
    />
  );
};

GraphiQLSpaceX.storyName = 'SpaceX';
