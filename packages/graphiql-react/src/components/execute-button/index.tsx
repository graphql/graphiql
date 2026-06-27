import type { FC } from 'react';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { PlayIcon, StopIcon } from '../../icons';
import { DropdownMenu } from '../dropdown-menu';
import { Tooltip } from '../tooltip';
import { KEY_MAP, formatShortcutForOS } from '../../constants';
import { pick, getRunBlockReason, resolveActiveOperation } from '../../utility';
import './index.css';

export const ExecuteButton: FC = () => {
  const { setOperationName, run, stop } = useGraphiQLActions();
  const {
    operations = [],
    operationName,
    isFetching,
    overrideOperationName,
    transportMethod,
  } = useGraphiQL(
    pick(
      'operations',
      'operationName',
      'isFetching',
      'overrideOperationName',
      'transportMethod',
    ),
  );
  const isSubscribed = useGraphiQL(state => Boolean(state.subscription));
  const hasOptions =
    operations.length > 1 && typeof overrideOperationName !== 'string';
  const isRunning = isFetching || isSubscribed;

  const runDisabledReason = getRunBlockReason(
    transportMethod,
    resolveActiveOperation(operations, operationName),
  );
  // Never block the Stop affordance — only a fresh run can be blocked.
  const isBlocked = !isRunning && runDisabledReason !== null;

  const label = isBlocked
    ? runDisabledReason!
    : `${isRunning ? 'Stop' : 'Execute'} query (${formatShortcutForOS(KEY_MAP.runQuery.key, 'Cmd')})`;
  const buttonProps = {
    type: 'button' as const,
    className: 'graphiql-execute-button',
    children: isRunning ? <StopIcon /> : <PlayIcon />,
    'aria-label': label,
  };

  return hasOptions && !isRunning ? (
    <DropdownMenu>
      <Tooltip label={label}>
        <DropdownMenu.Button {...buttonProps} />
      </Tooltip>

      <DropdownMenu.Content>
        {operations.map((operation, i) => {
          const opName = operation.name
            ? operation.name.value
            : `<Unnamed ${operation.operation}>`;
          return (
            <DropdownMenu.Item
              key={`${opName}-${i}`}
              disabled={getRunBlockReason(transportMethod, operation) !== null}
              onSelect={() => {
                const selectedOperationName = operation.name?.value;
                if (
                  selectedOperationName &&
                  selectedOperationName !== operationName
                ) {
                  setOperationName(selectedOperationName);
                }
                run();
              }}
            >
              {opName}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  ) : (
    <Tooltip label={label}>
      {isBlocked ? (
        // A native disabled button emits no pointer/focus events, so Radix
        // would never open the tooltip explaining why it's disabled. Wrap it
        // in a focusable span that receives the events instead.
        <span className="graphiql-execute-button-tooltip-target" tabIndex={0}>
          <button {...buttonProps} disabled onClick={run} />
        </span>
      ) : (
        <button {...buttonProps} onClick={isRunning ? stop : run} />
      )}
    </Tooltip>
  );
};
