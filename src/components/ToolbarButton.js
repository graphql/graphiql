/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

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
    active: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  render() {
    const { error } = this.state;
    const { active } = this.props;

    let className = 'toolbar-button';
    if (error) {
      className += ' error';
    } else if (active) {
      className += ' activated';
    }

    return (
      <a
        className={className}
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
