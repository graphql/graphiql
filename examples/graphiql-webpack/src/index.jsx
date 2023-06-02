import 'regenerator-runtime/runtime.js';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { useExplorerPlugin } from '@graphiql/plugin-explorer';
import { useExporterPlugin } from '@graphiql/plugin-code-exporter';
import 'graphiql/graphiql.css';
import '@graphiql/plugin-explorer/dist/style.css';
import '@graphiql/plugin-code-exporter/dist/style.css';

const removeQueryName = query =>
  query.replace(
    /^[^{(]+([{(])/,
    (_match, openingCurlyBracketsOrParenthesis) =>
      `query ${openingCurlyBracketsOrParenthesis}`,
  );

const getQuery = (arg, spaceCount) => {
  const { operationDataList } = arg;
  const { query } = operationDataList[0];
  const anonymousQuery = removeQueryName(query);
  return (
    ' '.repeat(spaceCount) +
    anonymousQuery.replaceAll('\n', '\n' + ' '.repeat(spaceCount))
  );
};

const exampleSnippetOne = {
  name: 'Example One',
  language: 'JavaScript',
  codeMirrorMode: 'jsx',
  options: [],
  generate: arg => `export const query = graphql\`
${getQuery(arg, 2)}
\`
`,
};

const exampleSnippetTwo = {
  name: 'Example Two',
  language: 'JavaScript',
  codeMirrorMode: 'jsx',
  options: [],
  generate: arg => `import { graphql } from 'graphql'

export const query = graphql\`
${getQuery(arg, 2)}
\`
`,
};

const snippets = [exampleSnippetOne, exampleSnippetTwo];

const fetcher = async (graphQLParams, options) => {
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
};

const style = { height: '100vh' };

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

  const plugins = React.useMemo(
    () => [explorerPlugin, exporterPlugin],
    [explorerPlugin, exporterPlugin],
  );

  return (
    <GraphiQL
      style={style}
      query={query}
      onEditQuery={setQuery}
      plugins={plugins}
      fetcher={fetcher}
    />
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
