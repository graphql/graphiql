import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import type { Fetcher } from '@graphiql/toolkit';
import { CSSProperties } from 'react';

const fetcher: Fetcher = async graphQLParams => {
  const data = await fetch(
    'https://swapi-graphql.netlify.app/.netlify/functions/index',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphQLParams),
      credentials: 'same-origin',
    },
  );
  return data.json().catch(() => data.text());
};

const style: CSSProperties = { height: '100vh' };

const App = () => <GraphiQL style={style} fetcher={fetcher} />;

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Hot Module Replacement
module.hot?.accept();
