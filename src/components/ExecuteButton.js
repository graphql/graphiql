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
    customExecuteButton: React.Component
  }

  render() {
    return (
      <div
        className="execute-button-container"
        onClick={this.props.onClick}
        title="Execute Query (Ctrl-Enter)">
        {this.props.customExecuteButton ||
          <button className="execute-button">
            <svg width="34" height="34">
              <path d="M 11 9 L 24 16 L 11 23 z" />
            </svg>
          </button>
        }
      </div>
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
