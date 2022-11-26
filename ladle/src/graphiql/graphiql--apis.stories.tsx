import { GraphiQL } from '../../../packages/graphiql/src/index';
import '../../../packages/graphiql/vite_test/graphiql.css';
import { createGraphiQLFetcher } from '../../../packages/graphiql-toolkit';

const fetcher = ({ url }:{ url: string }) => createGraphiQLFetcher({ url });

export const SWAPI = () => {
  return <GraphiQL fetcher={ fetcher({url: 'https://swapi-graphql.netlify.app/.netlify/functions/index'})} />;
};

export const SpaceX = () => {
  return <GraphiQL fetcher={ fetcher({url: 'https://api.spacex.land/graphql/'})} />;
};
