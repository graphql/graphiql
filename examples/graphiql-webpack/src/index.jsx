import 'regenerator-runtime/runtime.js';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { getSnippets } from './snippets';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';
import 'graphiql/style.css';
import '@graphiql/plugin-explorer/style.css';
import '@graphiql/plugin-code-exporter/style.css';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useStorageContext } from '@graphiql/react';

export const STARTING_URL =
  'https://swapi-graphql.netlify.app/.netlify/functions/index';

import './index.css';
import { serverSelectPlugin, LAST_URL_KEY } from './select-server-plugin';

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

/**
 * A manual fetcher implementation example
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
  // TODO: a breaking change where we make URL an internal state concern, and then expose hooks
  // so that you can handle/set URL state internally from a plugin
  // fetcher could then pass a dynamic URL config object to the fetcher internally
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
      plugins={[serverSelect, explorer, exporter]}
      fetcher={fetcher}
      shouldPersistHeaders
    />
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
