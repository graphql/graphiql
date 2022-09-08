import 'regenerator-runtime/runtime.js';

import * as React from 'react';
import { render } from 'react-dom';
import GraphiQL from 'graphiql';
import snippets from 'graphiql-code-exporter/lib/snippets';
import { useExplorerPlugin } from '@graphiql/plugin-explorer';
import { useExporterPlugin } from '@graphiql/plugin-code-exporter';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-explorer/dist/style.css';

const App = () => {
  const [query, setQuery] = React.useState('');
  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });
  const exporterPlugin = useExporterPlugin({
    query,
    snippets,
  });

  return (
    <GraphiQL
      style={{ height: '100vh' }}
      query={query}
      onEditQuery={setQuery}
      plugins={[explorerPlugin, exporterPlugin]}
      fetcher={async (graphQLParams, options) => {
        const data = await fetch(
          'https://swapi-graphql.netlify.app/.netlify/functions/index',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              ...options.headers,
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'same-origin',
          },
        );
        return data.json().catch(() => data.text());
      }}
    />
  );
};

render(<App />, document.getElementById('root'));
