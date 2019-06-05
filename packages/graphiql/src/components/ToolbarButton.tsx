/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';

/**
 * ToolbarButton
 *
 * A button to use within the Toolbar.
 */

type ToolbarButtonProps = {
  onClick?: (...args: any[]) => any;
  title?: string;
  label?: string;
};

type ToolbarButtonState = {
  error: null;
};

export class ToolbarButton extends React.Component<
  ToolbarButtonProps,
  ToolbarButtonState
> {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  render() {
    const { error } = this.state;
    return (
      <a
        className={'toolbar-button' + (error ? ' error' : '')}
        onMouseDown={preventDefault}
        onClick={this.handleClick}
        title={error ? error.message : this.props.title}>
        {this.props.label}
      </a>
    );
  }
  handleClick = e => {
    e.preventDefault();
    try {
      this.props.onClick();
      this.setState({ error: null });
    } catch (error) {
      this.setState({ error });
    }
  };
}

function preventDefault(e) {
  e.preventDefault();
}
