// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` stays live.
'use no memo';

import type { FC, ReactNode } from 'react';
import { useGraphiQL } from '../provider';
import { ExecuteButton } from '../execute-button';
import { GraphQLLogoIcon } from '../../icons';
import './index.css';

export type TopBarProps = {
  /** Version string shown in the brand pill. */
  version?: string;
  /**
   * Custom branding rendered in place of the default GraphiQL icon + wordmark.
   * @default the GraphiQL hexagon icon and "GraphiQL" wordmark
   */
  brand?: ReactNode;
};

export const TopBar: FC<TopBarProps> = ({ version, brand }) => {
  const url = useGraphiQL(state => state.transport?.url ?? '—');

  return (
    <TopBarView
      version={version}
      brand={brand}
      url={url}
      runButton={<ExecuteButton />}
    />
  );
};

export type TopBarViewProps = {
  version?: string;
  brand?: ReactNode;
  url: string;
  /** The run control, rendered at the end of the bar. */
  runButton?: ReactNode;
};

export const TopBarView: FC<TopBarViewProps> = ({
  version,
  brand,
  url,
  runButton,
}) => {
  return (
    <header className="graphiql-top-bar" role="banner">
      <div className="graphiql-top-bar-brand">
        {brand ?? (
          <>
            <GraphQLLogoIcon
              className="graphiql-top-bar-logo"
              aria-hidden="true"
            />
            <span className="graphiql-top-bar-wordmark">GraphiQL</span>
          </>
        )}
        {version && <span className="graphiql-top-bar-version">{version}</span>}
      </div>

      <div className="graphiql-top-bar-divider" aria-hidden="true" />

      <div className="graphiql-top-bar-endpoint">
        <span className="graphiql-top-bar-endpoint-url">{url}</span>
      </div>

      {runButton}
    </header>
  );
};
