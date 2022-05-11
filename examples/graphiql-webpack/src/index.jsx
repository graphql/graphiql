import React from 'react';
import { render } from 'react-dom';
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.css';

const Logo = () => <span>My Corp</span>;

// See GraphiQL Readme - Advanced Usage section for more examples like this
GraphiQL.Logo = Logo;

const App = () => (
  <GraphiQL
    style={{ height: '100vh' }}
    headerEditorEnabled
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

render(<App />, document.getElementById('root'));
