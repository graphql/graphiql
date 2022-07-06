import { OperationDefinitionNode } from 'graphql';
import { useState } from 'react';

import { useEditorContext } from '../editor';
import { useExecutionContext } from '../execution';
import { PlayIcon, StopIcon } from '../icons';
import { Dropdown } from '../ui';

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
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [highlight, setHighlight] = useState<OperationDefinitionNode | null>(
    null,
  );

  const operations = queryEditor?.operations || [];
  const hasOptions = operations.length > 1 && typeof operationName !== 'string';

  return (
    <div className="graphiql-execute-button-wrapper">
      <button
        type="button"
        className="graphiql-execute-button"
        onMouseDown={
          // Allow mouse down if there is no running query, there are options
          // for which operation to run, and the dropdown is currently closed.
          !isFetching && hasOptions && !optionsOpen
            ? downEvent => {
                let initialPress = true;
                const downTarget = downEvent.currentTarget;
                setHighlight(null);
                setOptionsOpen(true);

                type MouseUpEventHandler = (upEvent: MouseEvent) => void;
                let onMouseUp: MouseUpEventHandler | null = upEvent => {
                  if (initialPress && upEvent.target === downTarget) {
                    initialPress = false;
                  } else {
                    document.removeEventListener('mouseup', onMouseUp!);
                    onMouseUp = null;
                    const isOptionsMenuClicked =
                      upEvent.currentTarget &&
                      downTarget.parentNode?.compareDocumentPosition(
                        upEvent.currentTarget as Node,
                      ) &&
                      Node.DOCUMENT_POSITION_CONTAINED_BY;
                    if (!isOptionsMenuClicked) {
                      // menu calls setState if it was clicked
                      setOptionsOpen(false);
                    }
                  }
                };

                document.addEventListener('mouseup', onMouseUp);
              }
            : undefined
        }
        onClick={
          // Allow click event if there is a running query or if there are not
          // options for which operation to run.
          isFetching || !hasOptions
            ? () => {
                if (isFetching) {
                  stop();
                } else {
                  run();
                }
              }
            : undefined
        }
        title="Execute Query (Ctrl-Enter)"
      >
        {isFetching ? <StopIcon /> : <PlayIcon />}
      </button>
      {hasOptions && optionsOpen ? (
        <Dropdown>
          {operations.map((operation, i) => {
            const opName = operation.name
              ? operation.name.value
              : `<Unnamed ${operation.operation}>`;
            return (
              <Dropdown.Item
                key={`${opName}-${i}`}
                className={operation === highlight ? 'selected' : undefined}
                onMouseOver={() => setHighlight(operation)}
                onMouseOut={() => setHighlight(null)}
                onMouseUp={() => {
                  setOptionsOpen(false);
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
              </Dropdown.Item>
            );
          })}
        </Dropdown>
      ) : null}
    </div>
  );
}
