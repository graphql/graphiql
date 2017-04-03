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
  };

  constructor(props) {
    super(props);
    this.state = { visible: false };
  }

  componentWillUnmount() {
    this._release();
  }

  render() {
    const visible = this.state.visible;
    return (
      <a
        className="toolbar-menu toolbar-button"
        onClick={this.handleOpen.bind(this)}
        onMouseDown={preventDefault}
        ref={node => {
          this._node = node;
        }}
        title={this.props.title}>
        {this.props.label}
        <svg width="14" height="8">
          <path fill="#666" d="M 5 1.5 L 14 1.5 L 9.5 7 z" />
        </svg>
        <ul className={'toolbar-menu-items' + (visible ? ' open' : '')}>
          {this.props.children}
        </ul>
      </a>
    );
  }

  _subscribe() {
    if (!this._listener) {
      this._listener = this.handleClick.bind(this);
      document.addEventListener('click', this._listener);
    }
  }

  _release() {
    if (this._listener) {
      document.removeEventListener('click', this._listener);
      this._listener = null;
    }
  }

  handleClick(e) {
    if (this._node !== e.target) {
      preventDefault(e);
      this.setState({ visible: false });
      this._release();
    }
  }

  handleOpen = e => {
    preventDefault(e);
    this.setState({ visible: true });
    this._subscribe();
  };
}

export function ToolbarMenuItem({ onSelect, title, label }) {
  return (
    <li
      onMouseOver={e => {
        e.target.className = 'hover';
      }}
      onMouseOut={e => {
        e.target.className = null;
      }}
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
