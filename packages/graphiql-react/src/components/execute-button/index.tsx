// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC } from 'react';
import type { OperationDefinitionNode } from 'graphql';
import { clsx } from 'clsx';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { DropdownMenu } from '../dropdown-menu';
import { PlayIcon, StopIcon, ChevronDownIcon } from '../../icons';
import { resolveActiveOperation } from '../../utility/active-operation';
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

  return (
    <ExecuteButtonView
      isFetching={isFetching}
      isSubscribed={isSubscribed}
      operations={operations}
      operationName={operationName}
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
  /** The document's operations. A caret + picker only appears for more than one. */
  operations?: OperationDefinitionNode[];
  operationName?: string | null;
  onRun: () => void;
  onStop: () => void;
  onSetOperationName?: (operationName: string) => void;
};

export const ExecuteButtonView: FC<ExecuteButtonViewProps> = ({
  isFetching,
  isSubscribed = false,
  operations = [],
  operationName = null,
  onRun,
  onStop,
  onSetOperationName,
}) => {
  const isRunning = isFetching || isSubscribed;
  const hasOptions = operations.length > 1;
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
      aria-label={isRunning ? 'Stop operation' : 'Run operation'}
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
        ariaLabel={
          isRunning ? 'Stop operation shortcut' : 'Run operation shortcut'
        }
      />
    </button>
  );

  return (
    <div className="graphiql-execute-button">
      {primaryButton}

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
