// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { Tooltip } from '../tooltip';
import { GraphQLLogoIcon } from '../../icons';
import './index.css';

export type TopBarProps = {
  /** Version string shown in the brand pill. */
  version?: string;
};

export const TopBar: FC<TopBarProps> = ({ version }) => {
  const { run, setTransportMethod } = useGraphiQLActions();
  const isFetching = useGraphiQL(state => state.isFetching);
  const transport = useGraphiQL(state => state.transport);
  const transportMethod = useGraphiQL(state => state.transportMethod);

  const url = transport?.url ?? '—';
  const method: HttpMethod = transportMethod ?? 'POST';
  const supportedMethods = transport?.supportedMethods ?? ['POST'];

  return (
    <TopBarView
      version={version}
      isFetching={isFetching}
      url={url}
      method={method}
      supportedMethods={supportedMethods}
      onRun={run}
      onSetMethod={setTransportMethod}
    />
  );
};

export type TopBarViewProps = {
  version?: string;
  isFetching: boolean;
  url: string;
  method: HttpMethod;
  supportedMethods: HttpMethod[];
  onRun: () => void;
  onSetMethod: (method: HttpMethod) => void;
};

export const TopBarView: FC<TopBarViewProps> = ({
  version,
  isFetching,
  url,
  method,
  supportedMethods,
  onRun,
  onSetMethod,
}) => {
  const canSwitch = supportedMethods.length > 1;
  const otherMethod = supportedMethods.find(m => m !== method) ?? method;

  return (
    <header className="graphiql-top-bar" role="banner">
      <div className="graphiql-top-bar-brand">
        <GraphQLLogoIcon className="graphiql-top-bar-logo" aria-hidden="true" />
        <span className="graphiql-top-bar-wordmark">GraphiQL</span>
        {version && <span className="graphiql-top-bar-version">{version}</span>}
      </div>

      <div className="graphiql-top-bar-divider" aria-hidden="true" />

      <div className="graphiql-top-bar-endpoint">
        {canSwitch ? (
          <Tooltip label={`Switch to ${otherMethod}`}>
            <button
              type="button"
              className="graphiql-top-bar-method-toggle"
              onClick={() => onSetMethod(otherMethod)}
            >
              {method}
            </button>
          </Tooltip>
        ) : (
          <span className="graphiql-top-bar-endpoint-method">{method}</span>
        )}
        <span className="graphiql-top-bar-endpoint-url">{url}</span>
      </div>

      <button type="button" className="graphiql-top-bar-cmd">
        <span>Jump to schema</span>
        <KeycapHint
          keys={[MODIFIER.Meta, 'K']}
          ariaLabel="Open command palette"
        />
      </button>

      <button
        type="button"
        className="graphiql-top-bar-run"
        onClick={onRun}
        disabled={isFetching}
        aria-label="Run query"
      >
        Run
        <KeycapHint
          keys={[MODIFIER.Meta, MODIFIER.Enter]}
          ariaLabel="Run query shortcut"
        />
      </button>
    </header>
  );
};
