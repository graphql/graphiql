import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import 'graphiql/style.css';

const transport = createTransport({
  url: 'https://graphql.earthdata.nasa.gov/api',
});

function App() {
  return <GraphiQL transport={transport} />;
}

export default App;
