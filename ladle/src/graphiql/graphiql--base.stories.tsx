import GraphiQL from '../../../packages/graphiql/src/cdn';
import { createGraphiQLFetcher } from '../../../packages/graphiql-toolkit';

const fetcher = ({ url }: { url: string }) => createGraphiQLFetcher({ url });

export const TestSchema = () => {
  return (
    <GraphiQL fetcher={fetcher({ url: 'http://localhost:8080/graphql/' })} />
  );
};
