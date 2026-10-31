// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import { useId, type FC } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import type { OperationDefinitionNode } from 'graphql';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { DropdownMenu } from '../dropdown-menu';
import { Tooltip } from '../tooltip';
import { MethodPill } from '../method-pill';
import { PlayIcon, StopIcon, ChevronDownIcon } from '../../icons';
import { resolveActiveOperation } from '../../utility/active-operation';
import { useTransportMethod } from './use-transport-method';
import './index.css';

/** Select an operation and its query method separately from executing it. */
export const ExecuteButton: FC = () => {
  const { run, stop, setOperationName } = useGraphiQLActions();
  const isFetching = useGraphiQL(state => state.isFetching);
  const isSubscribed = useGraphiQL(state => Boolean(state.subscription));
  const operations = useGraphiQL(state => state.operations);
  const operationName = useGraphiQL(state => state.operationName);
  const transport = useGraphiQL(state => state.transport);
  const executingOperation = useGraphiQL(state => state.executingOperation);
  const method = useTransportMethod(transport);

  return (
    <ExecuteButtonView
      isFetching={isFetching}
      isSubscribed={isSubscribed}
      operations={operations}
      operationName={operationName}
      executingOperation={executingOperation}
      {...method}
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
  operations?: OperationDefinitionNode[];
  operationName?: string | null;
  /** The request snapshot, retained while the editor selection changes. */
  executingOperation?: OperationDefinitionNode;
  /** Effective query method; mutations display POST and subscriptions omit it. */
  queryMethod?: HttpMethod;
  supportedMethods?: readonly HttpMethod[];
  methodOverride?: HttpMethod;
  /** Only label Auto when the transport's selection policy is known. */
  isMethodAutomatic?: boolean;
  onRun: () => void;
  onStop: () => void;
  onSetOperationName?: (operationName: string) => void;
  onSetMethod?: (method?: HttpMethod) => void;
};

export const ExecuteButtonView: FC<ExecuteButtonViewProps> = ({
  isFetching,
  isSubscribed = false,
  operations = [],
  operationName = null,
  executingOperation,
  queryMethod,
  supportedMethods = [],
  methodOverride,
  isMethodAutomatic = false,
  onRun,
  onStop,
  onSetOperationName,
  onSetMethod,
}) => {
  const nameId = useId();
  const isRunning = isFetching || isSubscribed;
  const activeOperation =
    isRunning && executingOperation
      ? executingOperation
      : resolveActiveOperation(operations, operationName);
  const operationLabel = activeOperation
    ? (activeOperation.name?.value ??
      `<Anonymous ${activeOperation.operation}>`)
    : 'Choose operation';
  const isQuery = activeOperation?.operation === 'query';
  const method =
    activeOperation && activeOperation.operation !== 'subscription'
      ? isQuery
        ? queryMethod
        : queryMethod && 'POST'
      : undefined;
  const automatic = isQuery && isMethodAutomatic;
  const canSelectMethod = Boolean(onSetMethod);
  const name = (
    <>
      {activeOperation && <MethodPill operation={activeOperation.operation} />}
      <span id={nameId} className="graphiql-execute-button-name">
        {operationLabel}
      </span>
    </>
  );
  const methodLabel = (
    <span
      id={`${nameId}-method`}
      className="graphiql-execute-button-method-label"
    >
      {method}
    </span>
  );

  return (
    <div className="graphiql-execute-button">
      <Tooltip
        label={
          <span className="graphiql-execute-button-tooltip-label">
            <span>{isRunning ? 'Stop operation' : 'Run operation'}</span>
            <KeycapHint
              keys={[MODIFIER.Meta, MODIFIER.Enter]}
              ariaLabel={
                isRunning ? 'Stop operation shortcut' : 'Run operation shortcut'
              }
            />
          </span>
        }
      >
        <button
          type="button"
          className="graphiql-execute-button-segment graphiql-execute-button-primary"
          onClick={isRunning ? onStop : onRun}
          aria-label={isRunning ? 'Stop operation' : 'Run operation'}
          aria-describedby={nameId}
        >
          {isRunning ? (
            <StopIcon
              className="graphiql-execute-button-icon"
              aria-hidden="true"
            />
          ) : (
            <PlayIcon
              className="graphiql-execute-button-icon"
              aria-hidden="true"
            />
          )}
        </button>
      </Tooltip>

      {operations.length > 1 ? (
        <DropdownMenu>
          <Tooltip label={operationLabel}>
            <DropdownMenu.Button
              type="button"
              className="graphiql-execute-button-segment graphiql-execute-button-operation"
              aria-label="Choose operation to run"
              aria-describedby={nameId}
              disabled={isRunning}
            >
              {name}
              <ChevronDownIcon
                className="graphiql-execute-button-caret-icon"
                aria-hidden="true"
              />
            </DropdownMenu.Button>
          </Tooltip>
          <DropdownMenu.Content align="end">
            {operations.map((operation, i) => {
              const opName = operation.name?.value;
              const label = opName ?? `<Anonymous ${operation.operation}>`;
              return (
                <DropdownMenu.Item
                  key={`${label}-${i}`}
                  textValue={label}
                  disabled={!opName}
                  className="graphiql-execute-button-option"
                  role="menuitemradio"
                  aria-checked={operation === activeOperation}
                  onSelect={() => {
                    if (opName && opName !== operationName) {
                      onSetOperationName?.(opName);
                    }
                  }}
                >
                  <span className="graphiql-execute-button-menu-item">
                    <MethodPill operation={operation.operation} />
                    <span>{label}</span>
                  </span>
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu>
      ) : (
        <Tooltip label={operationLabel}>
          <span className="graphiql-execute-button-segment graphiql-execute-button-operation">
            {name}
          </span>
        </Tooltip>
      )}

      {method &&
        (canSelectMethod ? (
          <DropdownMenu>
            <DropdownMenu.Button
              type="button"
              className="graphiql-execute-button-segment graphiql-execute-button-method"
              aria-label="Choose request method"
              aria-describedby={`${nameId}-method`}
              disabled={isRunning}
            >
              {methodLabel}
              <ChevronDownIcon
                className="graphiql-execute-button-caret-icon"
                aria-hidden="true"
              />
            </DropdownMenu.Button>
            <DropdownMenu.Content align="end" aria-label="Request method">
              {isQuery && (
                <>
                  <DropdownMenu.Item
                    className="graphiql-execute-button-option"
                    role="menuitemradio"
                    aria-checked={automatic}
                    onSelect={() => onSetMethod?.()}
                  >
                    <span className="graphiql-execute-button-menu-item">
                      Auto
                    </span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                </>
              )}
              {(['QUERY', 'POST', 'GET'] as const).map(candidate => {
                const unavailableReason =
                  !isQuery && candidate !== 'POST'
                    ? `${candidate} is not supported for mutations.`
                    : !supportedMethods.includes(candidate)
                      ? `This server does not support ${candidate}.`
                      : undefined;
                const selected =
                  !unavailableReason &&
                  (isQuery
                    ? !automatic &&
                      (methodOverride ?? queryMethod) === candidate
                    : candidate === 'POST');
                const item = (
                  <DropdownMenu.Item
                    key={candidate}
                    className="graphiql-execute-button-option graphiql-execute-button-method-option"
                    role="menuitemradio"
                    textValue={candidate}
                    aria-disabled={unavailableReason ? true : undefined}
                    aria-checked={selected}
                    onSelect={event => {
                      if (unavailableReason) {
                        event.preventDefault();
                      } else if (isQuery) {
                        onSetMethod?.(candidate);
                      }
                    }}
                  >
                    <span className="graphiql-execute-button-menu-item">
                      {candidate}
                    </span>
                  </DropdownMenu.Item>
                );
                return unavailableReason ? (
                  <Tooltip
                    key={candidate}
                    label={unavailableReason}
                    side="left"
                  >
                    {item}
                  </Tooltip>
                ) : (
                  item
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu>
        ) : (
          <Tooltip
            label={isQuery ? 'Query request method' : 'Mutations require POST'}
          >
            <span className="graphiql-execute-button-segment graphiql-execute-button-method">
              {methodLabel}
            </span>
          </Tooltip>
        ))}
    </div>
  );
};
