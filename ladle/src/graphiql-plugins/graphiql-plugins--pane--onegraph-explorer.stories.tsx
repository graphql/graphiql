import { useState } from 'react';

// graphiql
import { GraphiQL } from '../../../packages/graphiql/src/index';
import '../../../packages/graphiql/build/graphiql.css';

// graphiql-plugin-explorer
import { useExplorerPlugin } from '../../../packages/graphiql-plugin-explorer/src/index';

// graphiql-toolkit
import { createGraphiQLFetcher } from '../../../packages/graphiql-toolkit';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

export const Default = () => {
  const [query, setQuery] = useState('');

  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });

  return (
    <GraphiQL
      fetcher={fetcher}
      onEditQuery={setQuery}
      plugins={[explorerPlugin]}
      query={query}
    />
  );
};

export const WithInitialQuery = () => {
  const [query, setQuery] = useState(
    'query AllFilms {\n  allFilms {\n    films {\n      title\n    }\n  }\n}',
  );

  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });

  return (
    <GraphiQL
      fetcher={fetcher}
      onEditQuery={setQuery}
      plugins={[explorerPlugin]}
      query={query}
    />
  );
};
