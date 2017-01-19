/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { PropTypes } from 'react';


/**
 * ToolbarSelect
 *
 * A select-option style button to use within the Toolbar.
 *
 * Note that, like React's <select>, this component is stateless and expects you
 * to re-render with a new selected={} condition on the child options.
 */
export function ToolbarSelect({ onSelect, title, children }) {
  let selectedChild;
  const optionChildren = React.Children.map(children, (child, i) => {
    if (!selectedChild || child.props.selected) {
      selectedChild = child;
    }
    const onChildSelect =
      child.props.onSelect ||
      onSelect && onSelect.bind(null, child.props.value, i);
    return <ToolbarSelectOption {...child.props} onSelect={onChildSelect} />;
  });

  return (
    <a
      className="toolbar-select toolbar-button"
      onMouseDown={preventDefault}
      title={title}>
      {selectedChild.props.label}
      <svg width="13" height="10">
        <path fill="#666" d="M 5 5 L 13 5 L 9 1 z" />
        <path fill="#666" d="M 5 6 L 13 6 L 9 10 z" />
      </svg>
      <ul className="toolbar-select-options">
        {optionChildren}
      </ul>
    </a>
  );
}

ToolbarSelect.propTypes = {
  onSelect: PropTypes.func,
  title: PropTypes.string,
};

export function ToolbarSelectOption({ onSelect, label, selected }) {
  return (
    <li
      onMouseOver={e => { e.target.className = 'hover'; }}
      onMouseOut={e => { e.target.className = null; }}
      onMouseDown={preventDefault}
      onMouseUp={onSelect}>
      {label}
      {selected &&
        <svg width="13" height="13">
          <polygon points="4.851,10.462 0,5.611 2.314,3.297 4.851,5.835
            10.686,0 13,2.314 4.851,10.462"
          />
        </svg>}
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
