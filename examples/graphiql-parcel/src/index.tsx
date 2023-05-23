import { createRoot } from 'react-dom/client';
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

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Hot Module Replacement
module.hot?.accept();
