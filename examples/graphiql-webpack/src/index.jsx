import 'regenerator-runtime/runtime.js';
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GraphiQL } from 'graphiql';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { getSnippets } from './snippets';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useStorage } from '@graphiql/react';
import { serverSelectPlugin, LAST_URL_KEY } from './select-server-plugin';
import 'graphiql/setup-workers/webpack';
import './index.css';

export const STARTING_URL = 'https://countries.trevorblades.com';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(registrationError => {
        console.error('SW registration failed:', registrationError);
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
 * unless you need to pass it dynamic values from your React app,
 * then use the `useMemo` hook
 */
const explorer = explorerPlugin();

function App() {
  const [currentUrl, setUrl] = useState('');
  // TODO: a breaking change where we make URL an internal state concern, and then expose hooks
  // so that you can handle/set URL state internally from a plugin
  // fetcher could then pass a dynamic URL config object to the fetcher internally
  const exporter = useMemo(
    () =>
      codeExporterPlugin({ snippets: getSnippets({ serverUrl: currentUrl }) }),
    [currentUrl],
  );
  const fetcher = useMemo(
    () => createGraphiQLFetcher({ url: currentUrl }),
    [currentUrl],
  );
  const serverSelect = useMemo(
    () => serverSelectPlugin({ url: currentUrl, setUrl }),
    [currentUrl],
  );

  return (
    <GraphiQL
      style={style}
      plugins={[serverSelect, explorer, exporter]}
      fetcher={fetcher}
      shouldPersistHeaders
    >
      <GraphiQLStorageBound setUrl={setUrl} />
    </GraphiQL>
  );
}

/**
 * `useStorage` is a context hook that's only available within the `<GraphiQL>`
 * provider tree. `<GraphiQLStorageBound>` must be rendered as a child of `<GraphiQL>`.
 */
function GraphiQLStorageBound({ setUrl }) {
  const storage = useStorage();
  const lastUrl = storage.get(LAST_URL_KEY) ?? STARTING_URL;

  useEffect(() => {
    setUrl(lastUrl);
  }, [lastUrl, setUrl]);

  return null;
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
