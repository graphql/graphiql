/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { MouseEventHandler, useState } from 'react';
import { OperationDefinitionNode } from 'graphql';
import { useSessionContext } from '../api/providers/GraphiQLSessionProvider';
import useQueryFacts from '../api/hooks/useQueryFacts';
import { useTranslation } from 'react-i18next';

/**
 * ExecuteButton
 *
 * What a nice round shiny button. Shows a drop-down when there are multiple
 * queries to run.
 */

type ExecuteButtonProps = {
  isRunning: boolean;
  onStop: () => void;
};

export function ExecuteButton(props: ExecuteButtonProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const queryFacts = useQueryFacts();
  const [highlight, setHighlight] = useState<OperationDefinitionNode | null>(
    null,
  );
  const session = useSessionContext();
  const operations = queryFacts?.operations ?? [];
  const hasOptions = operations && operations.length > 1;
  const { t } = useTranslation('Toolbar');

  let options: JSX.Element | null = null;
  if (hasOptions && optionsOpen) {
    options = (
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
                session.executeOperation(operation?.name?.value);
              }}
            >
              {opName}
            </li>
          );
        })}
      </ul>
    );
  }

  const onClick = () => {
    // Allow click event if there is a running query or if there are not options
    // for which operation to run.
    if (props.isRunning || !hasOptions) {
      if (props.isRunning) {
        props.onStop();
      } else {
        session.executeOperation();
      }
    }
  };

  const onMouseDown: MouseEventHandler<HTMLButtonElement> = downEvent => {
    // Allow mouse down if there is no running query, there are options for
    // which operation to run, and the dropdown is currently closed.
    if (!props.isRunning && hasOptions && !optionsOpen) {
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
  };

  const pathJSX = props.isRunning ? (
    <path d="M 10 10 L 23 10 L 23 23 L 10 23 z" />
  ) : (
    <path d="M 11 9 L 24 16 L 11 23 z" />
  );

  return (
    <div className="execute-button-wrap">
      <button
        type="button"
        className="execute-button"
        onMouseDown={onMouseDown}
        onClick={onClick}
        title={t('Execute Query (Ctrl-Enter)')}
      >
        <svg width="34" height="34">
          {pathJSX}
        </svg>
      </button>
      {options}
    </div>
  );
}
