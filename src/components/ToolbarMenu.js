/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';


/**
 * ToolbarMenu
 *
 * A menu style button to use within the Toolbar.
 */
export class ToolbarMenu extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    label: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = { visibility: 'hidden' };
  }

  render() {
    const ulStyle = {
      visibility: this.state.visibility
    };
    return (
      <a
        className="toolbar-menu toolbar-button"
        onClick={this.handleOpen.bind(this)}
        onMouseDown={preventDefault}
        ref={() => {
          document.addEventListener('click',
            this.handleClick.bind(this),
            false
          );
        }}
        title={this.props.title}>
        {this.props.label}
        <svg width="14" height="8">
          <path fill="#666" d="M 5 1.5 L 14 1.5 L 9.5 7 z" />
        </svg>
        <ul className="toolbar-menu-items" style={ulStyle}>
          {this.props.children}
        </ul>
      </a>
    );
  }

  handleClick(e) {
    // eslint-disable-next-line no-undef
    if (ReactDOM.findDOMNode(this) !== e.target) {
      e.preventDefault();
      this.setState({ visibility: 'hidden' });
    }
  }

  handleOpen = e => {
    e.preventDefault();
    this.setState({ visibility: 'visible' });
  };
}

export function ToolbarMenuItem({ onSelect, title, label }) {
  return (
    <li
      onMouseOver={e => { e.target.className = 'hover'; }}
      onMouseOut={e => { e.target.className = null; }}
      onMouseDown={preventDefault}
      onMouseUp={onSelect}
      title={title}>
      {label}
    </li>
  );
}

ToolbarMenuItem.propTypes = {
  onSelect: PropTypes.func,
  title: PropTypes.string,
  label: PropTypes.string,
};

function preventDefault(e) {
  e.preventDefault();
}
