import { useEditorContext } from '../editor';
import { useExecutionContext } from '../execution';
import { PlayIcon, StopIcon } from '../icons';
import { Menu, Tooltip } from '../ui';

import './execute.css';

export function ExecuteButton() {
  const { queryEditor } = useEditorContext({
    nonNull: true,
    caller: ExecuteButton,
  });
  const { isFetching, run, stop, subscription } = useExecutionContext({
    nonNull: true,
    caller: ExecuteButton,
  });

  const isRunning = isFetching || Boolean(subscription);
  const operations = queryEditor?.operations || [];
  const hasOptions = operations.length > 1;

  const label = `${isRunning ? 'Stop' : 'Execute'} query (Ctrl-Enter)`;
  const buttonProps = {
    type: 'button' as const,
    className: 'graphiql-execute-button',
    children: isRunning ? <StopIcon /> : <PlayIcon />,
    'aria-label': label,
  };

  return hasOptions ? (
    <Menu>
      <Tooltip label={label}>
        <Menu.Button {...buttonProps} />
      </Tooltip>

      <Menu.List>
        {operations.map((operation, i) => {
          const opName = operation.name
            ? operation.name.value
            : `<Unnamed ${operation.operation}>`;
          return (
            <Menu.Item
              key={`${opName}-${i}`}
              onSelect={() => {
                run(operation.name?.value);
              }}>
              {opName}
            </Menu.Item>
          );
        })}
      </Menu.List>
    </Menu>
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
}
