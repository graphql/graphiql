import 'regenerator-runtime/runtime.js';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { getSnippets } from './snippets';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';
import 'graphiql/graphiql.css';
import '@graphiql/plugin-explorer/dist/style.css';
import '@graphiql/plugin-code-exporter/dist/style.css';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useStorageContext } from '@graphiql/react';

import { serverSelectPlugin } from './select-server-plugin';
import { LAST_URL_KEY, STARTING_URL } from './constants';

/**
 * A manual fetcher implementation, you should probably
 * just use `createGraphiQLFetcher` from `@graphiql/toolkit
 * @returns
 */
// const fetcher = async (graphQLParams, options) => {
//   const data = await fetch(
//    STARTING_URL,
//     {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         'Content-Type': 'application/json',
//         ...options.headers,
//       },
//       body: JSON.stringify(graphQLParams),
//       credentials: 'same-origin',
//     },
//   );
//   return data.json().catch(() => data.text());
// };

const style = { height: '100vh' };
/**
 * instantiate outside of the component lifecycle
 * unless you need to pass it dynamic values from your react app,
 * then use the `useMemo` hook
 */
const explorer = explorerPlugin();

const App = () => {
  const storage = useStorageContext();

  const lastUrl = storage?.get(LAST_URL_KEY);
  const [currentUrl, setUrl] = React.useState(lastUrl ?? STARTING_URL);
  const exporter = React.useMemo(
    () =>
      codeExporterPlugin({ snippets: getSnippets({ serverUrl: currentUrl }) }),
    [currentUrl],
  );
  const fetcher = React.useMemo(
    () => createGraphiQLFetcher({ url: currentUrl }),
    [currentUrl],
  );
  const serverSelect = React.useMemo(
    () => serverSelectPlugin({ url: currentUrl, setUrl }),
    [currentUrl],
  );

  return (
    <GraphiQL
      style={style}
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo
      plugins={[serverSelect, explorer, exporter]}
      fetcher={fetcher}
      shouldPersistHeaders
    />
  );
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
