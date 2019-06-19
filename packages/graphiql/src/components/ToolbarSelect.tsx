/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';

type ToolbarSelectProps = {
  title?: string;
  label?: string;
  onSelect?: (...args: any[]) => any;
};

type ToolbarSelectState = {
  visible: boolean;
};

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
  _listener: EventListener;
  _node: HTMLElement;

  constructor(props: ToolbarSelectProps) {
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
  handleClick(e: MouseEvent) {
    if (this._node !== e.target) {
      preventDefault(e);
      this.setState({ visible: false });
      this._release();
    }
  }
  handleOpen = (e: MouseEvent) => {
    preventDefault(e);
    this.setState({ visible: true });
    this._subscribe();
  };
}

type ToolbarSelectOptionProps = {
  onSelect?: (...args: any[]) => any;
  selected?: boolean;
  label?: string;
  value?: any;
};

export const ToolbarSelectOption: React.SFC<ToolbarSelectOptionProps> = ({
  onSelect,
  label,
  selected,
}) => {
  return (
    <li
      onMouseOver={(e: React.MouseEvent) => {
        e.target.className = 'hover';
      }}
      onMouseOut={(e: React.MouseEvent) => {
        e.target.className = null;
      }}
      onMouseDown={preventDefault}
      onMouseUp={onSelect}>
      {label}
      {selected && (
        <svg width="13" height="13">
          <polygon points="4.851,10.462 0,5.611 2.314,3.297 4.851,5.835/>,0 13,2.314 4.851,10.462" />
        </svg>
      )}
    </li>
  );
};

function preventDefault(e: React.SyntheticEvent) {
  e.preventDefault();
}
