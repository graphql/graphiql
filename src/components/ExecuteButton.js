/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import React from 'react';


/**
 * ExecuteButton
 *
 * What a nice round shiny button. Cmd/Ctrl-Enter is the shortcut.
 */
export class ExecuteButton extends React.Component {
  render() {
    return (
      <button
        className="execute-button"
        onClick={this.props.onClick}
        title="Execute Query (Ctrl-Enter)">
        <svg width="34" height="34">
          <path d="M 11 9 L 24 16 L 11 23 z" />
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
