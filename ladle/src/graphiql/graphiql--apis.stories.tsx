import GraphiQL from '../../../packages/graphiql/src/cdn';
// import '../../../packages/graphiql/src/style.css';
// import '../../../packages/graphiql/build/graphiql.min.css';
import { createGraphiQLFetcher } from '../../../packages/graphiql-toolkit';

// import { GraphiQL } from 'graphiql';
// import GraphiQL from 'graphiql';
// import 'graphiql/build/graphiql.min.css';

const fetcher = ({ url }: { url: string }) => createGraphiQLFetcher({ url });

export const SWAPI = () => {
  return (
    <GraphiQL
      fetcher={fetcher({
        url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
      })}
    />
  );
};

export const SpaceX = () => {
  return (
    <GraphiQL fetcher={fetcher({ url: 'https://api.spacex.land/graphql/' })} />
  );
};

export const TestSchema = () => {
  return (
    <GraphiQL fetcher={fetcher({ url: 'http://localhost:8080/graphql/' })} />
  );
};
