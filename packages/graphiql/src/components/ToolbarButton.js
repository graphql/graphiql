/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
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
  };

  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  render() {
    const { error } = this.state;
    return (
      <button
        className={'toolbar-button' + (error ? ' error' : '')}
        onClick={this.handleClick}
        title={error ? error.message : this.props.title}
        aria-invalid={error ? 'true' : 'false'}
        aria-description={error ? error.message : null}>
        {this.props.label}
      </button>
    );
  }

  handleClick = () => {
    try {
      this.props.onClick();
      this.setState({ error: null });
    } catch (error) {
      this.setState({ error });
    }
  };
}
