/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * ToolbarSelect
 *
 * A select-option style button to use within the Toolbar.
 *
 */

export class ToolbarSelect extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    label: PropTypes.string,
    onSelect: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { visible: false };
  }

  componentWillUnmount() {
    this._release();
  }

  render() {
    let selectedChild;
    const visible = this.state.visible;
    const optionChildren = React.Children.map(
      this.props.children,
      (child, i) => {
        if (!selectedChild || child.props.selected) {
          selectedChild = child;
        }
        const onChildSelect =
          child.props.onSelect ||
          (this.props.onSelect &&
            this.props.onSelect.bind(null, child.props.value, i));
        return (
          <ToolbarSelectOption {...child.props} onSelect={onChildSelect} />
        );
      }
    );
    return (
      <a
        className="toolbar-select toolbar-button"
        onClick={this.handleOpen.bind(this)}
        onMouseDown={preventDefault}
        ref={node => {
          this._node = node;
        }}
        title={this.props.title}>
        {selectedChild.props.label}
        <svg width="13" height="10">
          <path fill="#666" d="M 5 5 L 13 5 L 9 1 z" />
          <path fill="#666" d="M 5 6 L 13 6 L 9 10 z" />
        </svg>
        <ul className={'toolbar-select-options' + (visible ? ' open' : '')}>
          {optionChildren}
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

export function ToolbarSelectOption({ onSelect, label, selected }) {
  return (
    <li
      onMouseOver={e => {
        e.target.className = 'hover';
      }}
      onMouseOut={e => {
        e.target.className = null;
      }}
      onMouseDown={preventDefault}
      onMouseUp={onSelect}>
      {label}
      {selected && (
        <svg width="13" height="13">
          <polygon
            points="4.851,10.462 0,5.611 2.314,3.297 4.851,5.835
            10.686,0 13,2.314 4.851,10.462"
          />
        </svg>
      )}
    </li>
  );
}

ToolbarSelectOption.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.bool,
  label: PropTypes.string,
  value: PropTypes.any,
};

function preventDefault(e) {
  e.preventDefault();
}
