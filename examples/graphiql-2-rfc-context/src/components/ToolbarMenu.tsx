/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { FC, MouseEventHandler } from 'react';

type ToolbarMenuProps = {
  title: string;
  label: string;
};

type ToolbarMenuState = {
  visible: boolean;
};

/**
 * ToolbarMenu
 *
 * A menu style button to use within the Toolbar.
 */
export class ToolbarMenu extends React.Component<
  ToolbarMenuProps,
  ToolbarMenuState
> {
  private _node: HTMLAnchorElement | null = null;
  private _listener: this['handleClick'] | null = null;

  constructor(props: ToolbarMenuProps) {
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
          if (node) {
            this._node = node;
          }
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

  handleClick(e: MouseEvent | React.MouseEvent<HTMLAnchorElement>) {
    if (this._node !== e.target) {
      e.preventDefault();
      this.setState({ visible: false });
      this._release();
    }
  }

  handleOpen: MouseEventHandler<HTMLAnchorElement> = e => {
    preventDefault(e);
    this.setState({ visible: true });
    this._subscribe();
  };
}

type ToolbarMenuItemProps = {
  onSelect: () => void;
  title: string;
  label: string;
};

export const ToolbarMenuItem: FC<ToolbarMenuItemProps> = ({
  onSelect,
  title,
  label,
}) => {
  return (
    <li
      onMouseOver={e => {
        e.currentTarget.className = 'hover';
      }}
      onMouseOut={e => {
        e.currentTarget.className = '';
      }}
      onMouseDown={preventDefault}
      onMouseUp={onSelect}
      title={title}>
      {label}
    </li>
  );
};

function preventDefault(e: MouseEvent | React.MouseEvent) {
  e.preventDefault();
}
