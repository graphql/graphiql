/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';


/**
 * PrettifyButton
 *
 * A {} button that allows to unminify a graphql query
 */
export class PrettifyButton extends React.Component {
  static propTypes = {
    onClick: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }

  onClick = e => {
    e.preventDefault();
    try {
      this.props.onClick();
      this.setState({ error: null });
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    const { error } = this.state;
    return (
      <a
        className={'tool-button' + (error ? ' error' : '')}
        onClick={this.onClick}
        title={error ? error.message : 'Prettify Query'}>
        {'{ }'}
      </a>
    );
  }
}
