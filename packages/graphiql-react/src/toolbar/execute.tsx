import { FC } from 'react';
import { useEditorStore } from '../editor';
import { useExecutionStore } from '../stores';
import { PlayIcon, StopIcon } from '../icons';
import { DropdownMenu, Tooltip } from '../ui';
import { KEY_MAP } from '../constants';
import './execute.css';

export const ExecuteButton: FC = () => {
  const { queryEditor, setOperationName } = useEditorStore();
  const { isFetching, subscription, operationName, run, stop } =
    useExecutionStore();

  const operations = queryEditor?.operations || [];
  const hasOptions = operations.length > 1 && typeof operationName !== 'string';
  const isRunning = isFetching || Boolean(subscription);

  const label = `${isRunning ? 'Stop' : 'Execute'} query (${KEY_MAP.runQuery[0]})`;
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
                  queryEditor &&
                  selectedOperationName &&
                  selectedOperationName !== queryEditor.operationName
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
