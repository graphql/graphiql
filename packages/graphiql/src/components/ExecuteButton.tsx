/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React, { MouseEventHandler } from 'react';
import { OperationDefinitionNode } from 'graphql';

/**
 * ExecuteButton
 *
 * What a nice round shiny button. Shows a drop-down when there are multiple
 * queries to run.
 */

type ExecuteButtonProps = {
  operations?: OperationDefinitionNode[];
  isRunning: boolean;
  onStop: () => void;
  onRun: (value?: string) => void;
};

type ExecuteButtonState = {
  optionsOpen: boolean;
  highlight: OperationDefinitionNode | null;
};

export class ExecuteButton extends React.Component<
  ExecuteButtonProps,
  ExecuteButtonState
> {
  constructor(props: ExecuteButtonProps) {
    super(props);

    this.state = {
      optionsOpen: false,
      highlight: null,
    };
  }

  render() {
    const operations = this.props.operations || [];
    const optionsOpen = this.state.optionsOpen;
    const hasOptions = operations && operations.length > 1;

    let options = null;
    if (hasOptions && optionsOpen) {
      const highlight = this.state.highlight;
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
                onMouseOver={() => this.setState({ highlight: operation })}
                onMouseOut={() => this.setState({ highlight: null })}
                onMouseUp={() => this._onOptionSelected(operation)}>
                {opName}
              </li>
            );
          })}
        </ul>
      );
    }

    // Allow click event if there is a running query or if there are not options
    // for which operation to run.
    let onClick;
    if (this.props.isRunning || !hasOptions) {
      onClick = this._onClick;
    }

    // Allow mouse down if there is no running query, there are options for
    // which operation to run, and the dropdown is currently closed.
    let onMouseDown: MouseEventHandler<HTMLButtonElement> = () => {};
    if (!this.props.isRunning && hasOptions && !optionsOpen) {
      onMouseDown = this._onOptionsOpen;
    }

    const pathJSX = this.props.isRunning ? (
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
          title="Execute Query (Ctrl-Enter)">
          <svg width="34" height="34">
            {pathJSX}
          </svg>
        </button>
        {options}
      </div>
    );
  }

  _onClick = () => {
    if (this.props.isRunning) {
      this.props.onStop();
    } else {
      this.props.onRun();
    }
  };

  _onOptionSelected = (operation: OperationDefinitionNode) => {
    this.setState({ optionsOpen: false });
    this.props.onRun(operation.name && operation.name.value);
  };

  _onOptionsOpen: MouseEventHandler<HTMLButtonElement> = downEvent => {
    let initialPress = true;
    const downTarget = downEvent.currentTarget;
    this.setState({ highlight: null, optionsOpen: true });

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
          this.setState({ optionsOpen: false });
        }
      }
    };

    document.addEventListener('mouseup', onMouseUp);
  };
}
