// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { Tooltip } from '../tooltip';
import { GraphQLLogoIcon } from '../../icons';
import { cn, getRunBlockReason, resolveActiveOperation } from '../../utility';
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
  const runDisabledReason = useGraphiQL(state =>
    getRunBlockReason(
      state.transportMethod,
      resolveActiveOperation(state.operations, state.operationName),
    ),
  );

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
      runDisabledReason={runDisabledReason}
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
  /** Non-null when Run is blocked; the string is the reason shown in a tooltip. */
  runDisabledReason?: string | null;
  onRun: () => void;
  onSetMethod: (method: HttpMethod) => void;
};

export const TopBarView: FC<TopBarViewProps> = ({
  version,
  isFetching,
  url,
  method,
  supportedMethods,
  runDisabledReason = null,
  onRun,
  onSetMethod,
}) => {
  const canSwitch = supportedMethods.length > 1;
  const isBlocked = runDisabledReason !== null;
  // Clicking the chip cycles to the next supported method. When a mutation is
  // blocked on a safe method (GET/QUERY), the chip pulses and instead jumps
  // straight to POST so a single click resolves the block.
  const nextMethod =
    supportedMethods[
      (supportedMethods.indexOf(method) + 1) % supportedMethods.length
    ] ?? method;
  const switchTarget =
    isBlocked && supportedMethods.includes('POST') ? 'POST' : nextMethod;

  const runButton = (
    <button
      type="button"
      className="graphiql-top-bar-run"
      onClick={onRun}
      disabled={isFetching || isBlocked}
      aria-label="Run query"
    >
      Run
      <KeycapHint
        keys={[MODIFIER.Meta, MODIFIER.Enter]}
        ariaLabel="Run query shortcut"
      />
    </button>
  );

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
          <Tooltip label={`Switch to ${switchTarget}`}>
            <button
              type="button"
              className={cn(
                'graphiql-top-bar-method-toggle',
                isBlocked && 'graphiql-top-bar-method-toggle--attention',
              )}
              onClick={() => onSetMethod(switchTarget)}
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

      {isBlocked ? (
        <Tooltip label={runDisabledReason}>
          {/* A native disabled button emits no pointer/focus events, so Radix
              would never open the tooltip. Wrap it in a focusable span that
              receives the events instead. */}
          <span className="graphiql-top-bar-run-tooltip-target" tabIndex={0}>
            {runButton}
          </span>
        </Tooltip>
      ) : (
        runButton
      )}
    </header>
  );
};
