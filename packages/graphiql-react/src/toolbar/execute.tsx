import { useEditorContext } from '../editor';
import { useExecutionContext } from '../execution';
import { PlayIcon, StopIcon } from '../icons';
import { Menu } from '../ui';

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

  const buttonProps = {
    type: 'button' as const,
    className: 'graphiql-execute-button',
    title: 'Execute Query (Ctrl-Enter)',
    children: isRunning ? <StopIcon /> : <PlayIcon />,
  };

  return hasOptions ? (
    <Menu>
      <Menu.Button {...buttonProps} />
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
  );
}
