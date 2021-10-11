import React from 'react';
import { render } from 'react-dom';
import GraphiQL from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import 'graphiql/graphiql.css';

const Logo = () => <span>{'My Corp'}</span>;

// See GraphiQL Readme - Advanced Usage section for more examples like this
GraphiQL.Logo = Logo;

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

const App = () => (
  <GraphiQL style={{ height: '100vh' }} headerEditorEnabled fetcher={fetcher} />
);

render(<App />, document.getElementById('root'));
