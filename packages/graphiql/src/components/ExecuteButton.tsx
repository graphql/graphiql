/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { useEditorContext, useExecutionContext } from '@graphiql/react';
import { OperationDefinitionNode } from 'graphql';
import React, { useState } from 'react';

export function ExecuteButton() {
  const { queryEditor, setOperationName } = useEditorContext({ nonNull: true });
  const { isFetching, operationName, run, stop } = useExecutionContext({
    nonNull: true,
  });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [highlight, setHighlight] = useState<OperationDefinitionNode | null>(
    null,
  );

  const operations = queryEditor?.operations || [];
  const hasOptions = operations.length > 1 && typeof operationName !== 'string';

  return (
    <div className="execute-button-wrap">
      <button
        type="button"
        className="execute-button"
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
        <svg width="34" height="34">
          {isFetching ? (
            <path d="M 10 10 L 23 10 L 23 23 L 10 23 z" />
          ) : (
            <path d="M 11 9 L 24 16 L 11 23 z" />
          )}
        </svg>
      </button>
      {hasOptions && optionsOpen ? (
        <ul className="execute-options">
          {operations.map((operation, i) => {
            const opName = operation.name
              ? operation.name.value
              : `<Unnamed ${operation.operation}>`;
            return (
              <li
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
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
