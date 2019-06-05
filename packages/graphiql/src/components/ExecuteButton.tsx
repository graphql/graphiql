/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as React from "react";

type ExecuteButtonProps = {
  onRun?: (...args: any[]) => any,
  onStop?: (...args: any[]) => any,
  isRunning?: boolean,
  operations?: any[]
};

type ExecuteButtonState = {
  optionsOpen: boolean,
  highlight: null
};

/**
 * ExecuteButton
 *
 * What a nice round shiny button. Shows a drop-down when there are multiple
 * queries to run.
 */
export class ExecuteButton extends React.Component<
  ExecuteButtonProps,
  ExecuteButtonState
> {
  constructor(props) {
    super(props);
    this.state = {
      optionsOpen: false,
      highlight: null
    };
  }
  render() {
    const operations = this.props.operations;
    const optionsOpen = this.state.optionsOpen;
    const hasOptions = operations && operations.length > 1;
    let options = null;
    if (hasOptions && optionsOpen) {
      const highlight = this.state.highlight;
      options = (
        <ul className="execute-options">
          {operations.map(operation => (
            <li
              key={operation.name ? operation.name.value : "*"}
              className={operation === highlight ? "selected" : undefined}
              onMouseOver={() => this.setState({ highlight: operation })}
              onMouseOut={() => this.setState({ highlight: null })}
              onMouseUp={() => this._onOptionSelected(operation)}
            >
              {operation.name ? operation.name.value : "<Unnamed>"}
            </li>
          ))}
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
    let onMouseDown;
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
          title="Execute Query (Ctrl-Enter)"
        >
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
  _onOptionSelected = operation => {
    this.setState({ optionsOpen: false });
    this.props.onRun(operation.name && operation.name.value);
  };
  _onOptionsOpen = downEvent => {
    let initialPress = true;
    const downTarget = downEvent.target;
    this.setState({ highlight: null, optionsOpen: true });
    let onMouseUp = (upEvent: React.MouseEvent) => {
      if (initialPress && upEvent.target === downTarget) {
        initialPress = false;
      } else {
        document.removeEventListener("mouseup", onMouseUp);
        onMouseUp = null;
        const isOptionsMenuClicked =
          downTarget.parentNode.compareDocumentPosition(upEvent.target) &
          Node.DOCUMENT_POSITION_CONTAINED_BY;
        if (!isOptionsMenuClicked) {
          // menu calls setState if it was clicked
          this.setState({ optionsOpen: false });
        }
      }
    };
    document.addEventListener("mouseup", onMouseUp);
  };
}
