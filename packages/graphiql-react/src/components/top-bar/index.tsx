// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC, ReactNode } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import type { OperationDefinitionNode } from 'graphql';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { Tooltip } from '../tooltip';
import { DropdownMenu } from '../dropdown-menu';
import { GraphQLLogoIcon, PlayIcon, ChevronDownIcon } from '../../icons';
import { clsx } from 'clsx';
import { getRunBlockReason, resolveActiveOperation } from '../../utility';
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
  const { run, setTransportMethod, setOperationName } = useGraphiQLActions();
  const isFetching = useGraphiQL(state => state.isFetching);
  const transport = useGraphiQL(state => state.transport);
  const transportMethod = useGraphiQL(state => state.transportMethod);
  const operations = useGraphiQL(state => state.operations);
  const operationName = useGraphiQL(state => state.operationName);
  const overrideOperationName = useGraphiQL(
    state => state.overrideOperationName,
  );
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
      isFetching={isFetching}
      url={url}
      method={method}
      supportedMethods={supportedMethods}
      runDisabledReason={runDisabledReason}
      operations={operations}
      operationName={operationName}
      overrideOperationName={overrideOperationName}
      transportMethod={transportMethod}
      onRun={run}
      onSetMethod={setTransportMethod}
      onSetOperationName={setOperationName}
    />
  );
};

export type TopBarViewProps = {
  version?: string;
  brand?: ReactNode;
  isFetching: boolean;
  url: string;
  method: HttpMethod;
  supportedMethods: HttpMethod[];
  /** Non-null when Run is blocked; the string is the reason shown in a tooltip. */
  runDisabledReason?: string | null;
  /** The document's operations. A caret + picker only appears for more than one. */
  operations?: OperationDefinitionNode[];
  operationName?: string | null;
  /** When set, an external caller has pinned the operation; the picker is hidden. */
  overrideOperationName?: string | null;
  transportMethod?: HttpMethod | null;
  onRun: () => void;
  onSetMethod: (method: HttpMethod) => void;
  onSetOperationName?: (operationName: string) => void;
};

export const TopBarView: FC<TopBarViewProps> = ({
  version,
  brand,
  isFetching,
  url,
  method,
  supportedMethods,
  runDisabledReason = null,
  operations = [],
  operationName = null,
  overrideOperationName = null,
  transportMethod = null,
  onRun,
  onSetMethod,
  onSetOperationName,
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

  // A picker only makes sense when there's a choice to make, and only when
  // nothing outside the editor has already pinned the operation to run.
  const hasOptions =
    operations.length > 1 && typeof overrideOperationName !== 'string';
  const activeOperation = resolveActiveOperation(operations, operationName);

  const selectOperation = (selectedOperationName: string | undefined) => {
    if (selectedOperationName && selectedOperationName !== operationName) {
      onSetOperationName?.(selectedOperationName);
    }
    onRun();
  };

  const primaryButton = (
    <button
      type="button"
      className={clsx(
        'graphiql-top-bar-run-primary',
        !hasOptions && 'graphiql-top-bar-run-primary--solo',
      )}
      onClick={onRun}
      disabled={isFetching || isBlocked}
      aria-label="Run query"
    >
      <PlayIcon className="graphiql-top-bar-run-icon" aria-hidden="true" />
      <span className="graphiql-top-bar-run-label">Run</span>
      <span className="graphiql-top-bar-run-sep" aria-hidden="true" />
      <KeycapHint
        keys={[MODIFIER.Meta, MODIFIER.Enter]}
        ariaLabel="Run query shortcut"
      />
    </button>
  );

  const runButton = (
    <div className="graphiql-top-bar-run">
      {isBlocked ? (
        <Tooltip label={runDisabledReason}>
          {/* A native disabled button emits no pointer/focus events, so Radix
              would never open the tooltip. Wrap it in a focusable span that
              receives the events instead. */}
          <span className="graphiql-top-bar-run-tooltip-target" tabIndex={0}>
            {primaryButton}
          </span>
        </Tooltip>
      ) : (
        primaryButton
      )}

      {hasOptions && (
        <>
          <span className="graphiql-top-bar-run-sep" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenu.Button
              type="button"
              className="graphiql-top-bar-run-caret"
              disabled={isFetching}
              aria-label="Choose operation to run"
            >
              <ChevronDownIcon
                className="graphiql-top-bar-run-caret-icon"
                aria-hidden="true"
              />
            </DropdownMenu.Button>
            <DropdownMenu.Content align="end">
              {operations.map((operation, i) => {
                const opName = operation.name?.value;
                const label = opName ?? `<Unnamed ${operation.operation}>`;
                const isActive = operation === activeOperation;
                return (
                  <DropdownMenu.Item
                    key={`${label}-${i}`}
                    disabled={
                      getRunBlockReason(transportMethod, operation) !== null
                    }
                    onSelect={() => selectOperation(opName)}
                  >
                    <span
                      className={clsx(
                        'graphiql-top-bar-run-menu-item',
                        isActive && 'graphiql-top-bar-run-menu-item--active',
                      )}
                    >
                      {label}
                    </span>
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu>
        </>
      )}
    </div>
  );

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
