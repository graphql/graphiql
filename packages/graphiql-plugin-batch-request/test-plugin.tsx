import { render } from 'react-dom';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import * as React from 'react';
import { useBatchRequestPlugin } from './src/index';

// const url = 'https://swapi-graphql.netlify.app/.netlify/functions/index';
// const url = 'https://api.spacex.land/graphql';
const url = 'https://countries.trevorblades.com/graphql';

const fetcher = createGraphiQLFetcher({ url });

const App = () => {
  const [query, setQuery] = React.useState('');
  const batchRequestPlugin = useBatchRequestPlugin({ url });
  const defaultEditorToolsVisibility = true;
  return (
    <GraphiQL
      fetcher={fetcher}
      query={query}
      onEditQuery={setQuery}
      defaultEditorToolsVisibility={defaultEditorToolsVisibility}
      plugins={[batchRequestPlugin]}
    />
  );
}

render(<App />, document.getElementById('root'));