/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';

type ToolbarButtonProps = {
  onClick: () => void;
  title: string;
  label: string;
};

type ToolbarButtonState = {
  error: Error | null;
};

/**
 * ToolbarButton
 *
 * A button to use within the Toolbar.
 */
export class ToolbarButton extends React.Component<
  ToolbarButtonProps,
  ToolbarButtonState
> {
  constructor(props: ToolbarButtonProps) {
    super(props);
    this.state = { error: null };
  }

  render() {
    const { error } = this.state;
    return (
      <button
        type="button"
        className={'toolbar-button' + (error ? ' error' : '')}
        onClick={this.handleClick}
        title={error ? error.message : this.props.title}
        aria-invalid={error ? 'true' : 'false'}
      >
        {this.props.label}
      </button>
    );
  }

  handleClick = () => {
    try {
      this.props.onClick();
      this.setState({ error: null });
    } catch (error) {
      if (error instanceof Error) {
        this.setState({ error });
        return;
      }
      throw error;
    }
  };
}
