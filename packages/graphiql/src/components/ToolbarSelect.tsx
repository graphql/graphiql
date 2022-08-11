/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { MouseEventHandler, ReactNode } from 'react';

type ToolbarSelectProps = {
  title?: string;
  label?: string;
  onSelect?: (selection: string) => void;
  children?: ReactNode;
};

type ToolbarSelectState = {
  visible: boolean;
};

type HasProps<T> = T extends { props: any } ? T : never;

function hasProps<Child extends React.ReactNode>(
  child: Child,
): child is HasProps<Child> {
  if (!child || typeof child !== 'object' || !('props' in child)) {
    return false;
  }
  return true;
}

/**
 * ToolbarSelect
 *
 * A select-option style button to use within the Toolbar.
 *
 */

export class ToolbarSelect extends React.Component<
  ToolbarSelectProps,
  ToolbarSelectState
> {
  private _node: HTMLAnchorElement | null = null;
  private _listener: ((this: Document, ev: MouseEvent) => any) | null = null;
  constructor(props: ToolbarSelectProps) {
    super(props);
    this.state = { visible: false };
  }

  componentWillUnmount() {
    this._release();
  }

  render() {
    let selectedChild: HasProps<React.ReactNode> | undefined;
    const visible = this.state.visible;
    const optionChildren = React.Children.map(
      this.props.children,
      (child, i) => {
        if (!hasProps(child)) {
          return null;
        }
        if (!selectedChild || child.props.selected) {
          selectedChild = child;
        }
        const onChildSelect =
          child.props.onSelect ||
          this.props.onSelect?.bind(null, child.props.value, i);
        return (
          <ToolbarSelectOption {...child.props} onSelect={onChildSelect} />
        );
      },
    );
    return (
      <a
        className="toolbar-select toolbar-button"
        onClick={this.handleOpen.bind(this)}
        onMouseDown={preventDefault}
        ref={node => {
          this._node = node;
        }}
        title={this.props.title}
      >
        {selectedChild?.props.label}
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

  handleClick(e: MouseEvent) {
    if (this._node !== e.target) {
      preventDefault(e);
      this.setState({ visible: false });
      this._release();
    }
  }

  handleOpen = (e: React.MouseEvent) => {
    preventDefault(e);
    this.setState({ visible: true });
    this._subscribe();
  };
}

type ToolbarSelectOptionProps = {
  onSelect: MouseEventHandler<HTMLLIElement>;
  label: string;
  selected: boolean;
  value?: any;
};

export function ToolbarSelectOption({
  onSelect,
  label,
  selected,
}: ToolbarSelectOptionProps) {
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
    >
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

function preventDefault(e: any) {
  e.preventDefault();
}
