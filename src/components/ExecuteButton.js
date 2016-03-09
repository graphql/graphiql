/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';


/**
 * ExecuteButton
 *
 * What a nice round shiny button. Cmd/Ctrl-Enter is the shortcut.
 */
export class ExecuteButton extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    isRunning: PropTypes.bool
  }

  render() {
    return (
      <button
        className="execute-button"
        onClick={this.props.onClick}
        title="Execute Query (Ctrl-Enter)">
        <svg width="34" height="34">
          { this.props.isRunning ?
            <path d="M 10 10 L 23 10 L 23 23 L 10 23 z" /> :
            <path d="M 11 9 L 24 16 L 11 23 z" />
          }
        </svg>
      </button>
    );
  }

  componentDidMount() {
    this.keyHandler = event => {
      if ((event.metaKey || event.ctrlKey) && event.keyCode === 13) {
        event.preventDefault();
        if (this.props.onClick) {
          this.props.onClick();
        }
      }
    };
    document.addEventListener('keydown', this.keyHandler, true);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keyHandler, true);
  }
}
