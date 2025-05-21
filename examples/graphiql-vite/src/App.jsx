/* global globalThis */
/* eslint-disable import-x/no-extraneous-dependencies, import-x/default */
import { GraphiQL } from 'graphiql';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker.js?worker';
import 'graphiql/style.css';

globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    console.info('setup-workers', {
      label,
    });
    switch (label) {
      case 'json':
        return new JsonWorker();
      case 'graphql': {
        return new GraphQLWorker();
      }
    }
    return new EditorWorker();
  },
};

async function fetcher(graphQLParams) {
  const response = await fetch('https://graphql.earthdata.nasa.gov/api', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(graphQLParams),
  });
  return response.json();
}

function App() {
  return <GraphiQL fetcher={fetcher} />;
}

export default App;
