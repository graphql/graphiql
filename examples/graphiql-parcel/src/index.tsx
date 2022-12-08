import React from 'react';
import ReactDOM from 'react-dom';
import { GraphiQL } from 'graphiql';

const App = () => (
  <GraphiQL
    style={{ height: '100vh' }}
    fetcher={async graphQLParams => {
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
    }}
  />
);

ReactDOM.render(<App />, document.getElementById('root'));

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
