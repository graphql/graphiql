import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { GraphiQL } from 'graphiql';
import type { Fetcher, FetcherParams, FetcherOpts } from '@graphiql/toolkit';
import 'graphiql/setup-workers/vite';
import 'graphiql/style.css';
import './App.css';

const ENDPOINT_STORAGE_KEY = 'graphiql-desktop:endpoint';

function readStoredEndpoint(): string {
  try {
    return localStorage.getItem(ENDPOINT_STORAGE_KEY) ?? '';
  } catch {
    // localStorage can throw in locked-down environments; fall back to an
    // empty endpoint rather than crashing the app on startup.
    return '';
  }
}

export function App() {
  const [endpoint, setEndpoint] = useState(readStoredEndpoint);
  const [draftEndpoint, setDraftEndpoint] = useState(endpoint);

  useEffect(() => {
    try {
      localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoint);
    } catch {
      // Best-effort persistence only.
    }
  }, [endpoint]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setEndpoint(draftEndpoint.trim());
    },
    [draftEndpoint],
  );

  const fetcher: Fetcher = useMemo(
    () => async (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) => {
      const result = await window.graphiqlDesktop.fetchGraphQL({
        url: endpoint,
        headers: fetcherOpts?.headers as Record<string, string> | undefined,
        body: JSON.stringify(graphQLParams),
      });

      if (!result.text) {
        return {
          errors: [
            {
              message:
                result.errorMessage ??
                'The request failed with no response body',
            },
          ],
        };
      }

      try {
        return JSON.parse(result.text);
      } catch {
        const prefix = result.status ? `HTTP ${result.status}: ` : '';
        return {
          errors: [
            {
              message: `${prefix}Received a non-JSON response: ${result.text.slice(0, 500)}`,
            },
          ],
        };
      }
    },
    [endpoint],
  );

  return (
    <>
      <form className="graphiql-desktop-endpoint-bar" onSubmit={handleSubmit}>
        <label htmlFor="graphiql-desktop-endpoint-input">Endpoint</label>
        <input
          id="graphiql-desktop-endpoint-input"
          type="text"
          inputMode="url"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={draftEndpoint}
          onChange={event => setDraftEndpoint(event.target.value)}
          placeholder="https://api.example.com/graphql"
        />
        <button type="submit">Connect</button>
      </form>
      <div id="graphiql">
        {endpoint ? (
          <GraphiQL key={endpoint} fetcher={fetcher} />
        ) : (
          <div className="graphiql-desktop-empty-state">
            Enter a GraphQL endpoint above to get started.
          </div>
        )}
      </div>
    </>
  );
}
