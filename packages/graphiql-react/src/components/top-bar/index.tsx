'use no memo';

import type { FC } from 'react';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint } from '../keycap-hint';
import './index.css';

export type TopBarProps = {
  /** Endpoint URL to display (placeholder until transport lands). */
  endpointUrl?: string;
  /** Version string shown in the brand pill. */
  version?: string;
};

export const TopBar: FC<TopBarProps> = ({
  endpointUrl,
  version,
}) => {
  const { run } = useGraphiQLActions();
  const isFetching = useGraphiQL(state => state.isFetching);

  return (
    <header className="graphiql-top-bar" role="banner">
      <div className="graphiql-top-bar-brand">
        <span className="graphiql-top-bar-logo" aria-hidden="true" />
        <span className="graphiql-top-bar-wordmark">GraphiQL</span>
        {version && <span className="graphiql-top-bar-version">{version}</span>}
      </div>

      <div className="graphiql-top-bar-divider" aria-hidden="true" />

      <div className="graphiql-top-bar-endpoint">
        {/* Method/URL will be filled in once transport lands. */}
        <span className="graphiql-top-bar-endpoint-method">POST</span>
        <span className="graphiql-top-bar-endpoint-url">
          {endpointUrl ?? '/graphql'}
        </span>
      </div>

      <button type="button" className="graphiql-top-bar-cmd">
        <span>Jump to schema</span>
        <KeycapHint keys={['⌘', 'K']} ariaLabel="Open command palette" />
      </button>

      <button
        type="button"
        className="graphiql-top-bar-run"
        onClick={() => run()}
        disabled={isFetching}
        aria-label="Run query"
      >
        Run
        <KeycapHint keys={['⌘', '⏎']} ariaLabel="Run query shortcut" />
      </button>
    </header>
  );
};
