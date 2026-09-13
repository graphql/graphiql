// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import type { OperationDefinitionNode } from 'graphql';
import { clsx } from 'clsx';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { Tooltip } from '../tooltip';
import { DropdownMenu } from '../dropdown-menu';
import { PlayIcon, StopIcon, ChevronDownIcon } from '../../icons';
import {
  getRunBlockReason,
  resolveActiveOperation,
} from '../../utility/run-block';
import './index.css';

/**
 * Runs the active operation, and stops it while one is in flight. When the
 * document holds more than one operation the button grows a caret that opens a
 * picker, so a specific operation can be chosen instead of the active one.
 */
export const ExecuteButton: FC = () => {
  const { run, stop, setOperationName } = useGraphiQLActions();
  const isFetching = useGraphiQL(state => state.isFetching);
  const isSubscribed = useGraphiQL(state => Boolean(state.subscription));
  const operations = useGraphiQL(state => state.operations);
  const operationName = useGraphiQL(state => state.operationName);
  const overrideOperationName = useGraphiQL(
    state => state.overrideOperationName,
  );
  const transportMethod = useGraphiQL(state => state.transportMethod);
  const runDisabledReason = useGraphiQL(state =>
    getRunBlockReason(
      state.transportMethod,
      resolveActiveOperation(state.operations, state.operationName),
    ),
  );

  return (
    <ExecuteButtonView
      isFetching={isFetching}
      isSubscribed={isSubscribed}
      operations={operations}
      operationName={operationName}
      overrideOperationName={overrideOperationName}
      transportMethod={transportMethod}
      runDisabledReason={runDisabledReason}
      onRun={run}
      onStop={stop}
      onSetOperationName={setOperationName}
    />
  );
};

export type ExecuteButtonViewProps = {
  isFetching: boolean;
  /** An active subscription keeps the button in its stop state. */
  isSubscribed?: boolean;
  /** Non-null when a run is blocked; the string is the reason shown in a tooltip. */
  runDisabledReason?: string | null;
  /** The document's operations. A caret + picker only appears for more than one. */
  operations?: OperationDefinitionNode[];
  operationName?: string | null;
  /** When set, an external caller has pinned the operation; the picker is hidden. */
  overrideOperationName?: string | null;
  transportMethod?: HttpMethod | null;
  onRun: () => void;
  onStop: () => void;
  onSetOperationName?: (operationName: string) => void;
};

export const ExecuteButtonView: FC<ExecuteButtonViewProps> = ({
  isFetching,
  isSubscribed = false,
  runDisabledReason = null,
  operations = [],
  operationName = null,
  overrideOperationName = null,
  transportMethod = null,
  onRun,
  onStop,
  onSetOperationName,
}) => {
  const isRunning = isFetching || isSubscribed;
  // Never block the stop affordance; only a fresh run can be blocked.
  const isBlocked = !isRunning && runDisabledReason !== null;
  // A picker only makes sense when there's a choice to make, and only when
  // nothing outside the editor has already pinned the operation to run.
  const hasOptions =
    operations.length > 1 && typeof overrideOperationName !== 'string';
  // While running, the button is a single-purpose stop control; a picker
  // alongside it would offer to start something that can't start yet.
  const showCaret = hasOptions && !isRunning;
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
        'graphiql-execute-button-primary',
        !showCaret && 'graphiql-execute-button-primary--solo',
      )}
      onClick={isRunning ? onStop : onRun}
      disabled={isBlocked}
      aria-label={isRunning ? 'Stop query' : 'Run query'}
    >
      {isRunning ? (
        <StopIcon className="graphiql-execute-button-icon" aria-hidden="true" />
      ) : (
        <PlayIcon className="graphiql-execute-button-icon" aria-hidden="true" />
      )}
      <span className="graphiql-execute-button-label">
        {isRunning ? 'Stop' : 'Run'}
      </span>
      <span className="graphiql-execute-button-sep" aria-hidden="true" />
      <KeycapHint
        keys={[MODIFIER.Meta, MODIFIER.Enter]}
        ariaLabel={isRunning ? 'Stop query shortcut' : 'Run query shortcut'}
      />
    </button>
  );

  return (
    <div className="graphiql-execute-button">
      {isBlocked ? (
        <Tooltip label={runDisabledReason}>
          {/* A native disabled button emits no pointer/focus events, so Radix
              would never open the tooltip. Wrap it in a focusable span that
              receives the events instead. */}
          <span className="graphiql-execute-button-tooltip-target" tabIndex={0}>
            {primaryButton}
          </span>
        </Tooltip>
      ) : (
        primaryButton
      )}

      {showCaret && (
        <>
          <span className="graphiql-execute-button-sep" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenu.Button
              type="button"
              className="graphiql-execute-button-caret"
              aria-label="Choose operation to run"
            >
              <ChevronDownIcon
                className="graphiql-execute-button-caret-icon"
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
                        'graphiql-execute-button-menu-item',
                        isActive && 'graphiql-execute-button-menu-item--active',
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
};
