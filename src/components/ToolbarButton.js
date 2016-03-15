/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';


/**
 * ToolbarButton
 *
 * A button to use within the Toolbar.
 */
export class ToolbarButton extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    title: PropTypes.string,
    label: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  render() {
    const { error } = this.state;
    return (
      <a
        className={'toolbar-button' + (error ? ' error' : '')}
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
