import React from 'react';
import { createGraphiQLFetcher } from '../../../packages/graphiql-toolkit';
import { GraphiQL } from '../../../packages/graphiql';
import { useExplorerPlugin } from '../../../packages/graphiql-plugin-explorer';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

export const OneGraphExplorer = () => {
  const [query, setQuery] = React.useState('');

  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });
  return (
    <GraphiQL
      fetcher={fetcher}
      plugins={[explorerPlugin]}
      query={query}
      onEditQuery={setQuery}
    />
  );
};
