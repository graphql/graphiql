import { useEditorContext } from '../editor';
import { useExecutionContext } from '../execution';
import { PlayIcon, StopIcon } from '../icons';
import { Menu } from '../ui';

import './execute.css';

export function ExecuteButton() {
  const { queryEditor, setOperationName } = useEditorContext({
    nonNull: true,
    caller: ExecuteButton,
  });
  const { isFetching, operationName, run, stop } = useExecutionContext({
    nonNull: true,
    caller: ExecuteButton,
  });

  const operations = queryEditor?.operations || [];
  const hasOptions = operations.length > 1 && typeof operationName !== 'string';

  const buttonProps = {
    type: 'button' as const,
    className: 'graphiql-execute-button',
    title: 'Execute Query (Ctrl-Enter)',
    children: isFetching ? <StopIcon /> : <PlayIcon />,
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
            </Menu.Item>
          );
        })}
      </Menu.List>
    </Menu>
  ) : (
    <button
      {...buttonProps}
      onClick={() => {
        if (isFetching) {
          stop();
        } else {
          run();
        }
      }}
    />
  );
}
