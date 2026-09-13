// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC, ReactNode } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { Tooltip } from '../tooltip';
import { ExecuteButton } from '../execute-button';
import { GraphQLLogoIcon } from '../../icons';
import { clsx } from 'clsx';
import {
  getRunBlockReason,
  resolveActiveOperation,
} from '../../utility/run-block';
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
  const { setTransportMethod } = useGraphiQLActions();
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
      brand={brand}
      url={url}
      method={method}
      supportedMethods={supportedMethods}
      runDisabledReason={runDisabledReason}
      runButton={<ExecuteButton />}
      onSetMethod={setTransportMethod}
    />
  );
};

export type TopBarViewProps = {
  version?: string;
  brand?: ReactNode;
  url: string;
  method: HttpMethod;
  supportedMethods: HttpMethod[];
  /**
   * Non-null when a run is blocked; drives the method toggle's attention state.
   * The reason itself is surfaced by the run control.
   */
  runDisabledReason?: string | null;
  /** The run control, rendered at the end of the bar. */
  runButton?: ReactNode;
  onSetMethod: (method: HttpMethod) => void;
};

export const TopBarView: FC<TopBarViewProps> = ({
  version,
  brand,
  url,
  method,
  supportedMethods,
  runDisabledReason = null,
  runButton,
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

      {canSwitch ? (
        <Tooltip label={`Switch to ${switchTarget}`}>
          <button
            type="button"
            className={clsx(
              'graphiql-top-bar-method-toggle',
              isBlocked && 'graphiql-top-bar-method-toggle--attention',
            )}
            onClick={() => onSetMethod(switchTarget)}
          >
            {method}
          </button>
        </Tooltip>
      ) : (
        <span className="graphiql-top-bar-method-label">{method}</span>
      )}

      <div className="graphiql-top-bar-endpoint">
        <span className="graphiql-top-bar-endpoint-url">{url}</span>
      </div>

      {runButton}
    </header>
  );
};
