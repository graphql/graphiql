import { FC } from 'react';
import { useEditorStore, useExecutionStore } from '../../stores';
import { PlayIcon, StopIcon } from '../../icons';
import { DropdownMenu } from '../dropdown-menu';
import { Tooltip } from '../tooltip';
import { KEY_MAP } from '../../constants';
import './index.css';

export const ExecuteButton: FC = () => {
  const { setOperationName, operations = [], operationName } = useEditorStore();
  const {
    isFetching,
    subscription,
    operationName: execOperationName,
    run,
    stop,
  } = useExecutionStore();
  const hasOptions =
    operations.length > 1 && typeof execOperationName !== 'string';
  const isRunning = isFetching || Boolean(subscription);

  const label = `${isRunning ? 'Stop' : 'Execute'} query (${KEY_MAP.runQuery.key})`;
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
      <button
        {...buttonProps}
        onClick={() => {
          if (isRunning) {
            stop();
          } else {
            run();
          }
        }}
      />
    </Tooltip>
  );
};
