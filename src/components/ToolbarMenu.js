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
export function ToolbarMenu({ title, label, children }) {
  return (
    <a
      className="toolbar-menu toolbar-button"
      onMouseDown={preventDefault}
      title={title}>
      {label}
      <svg width="14" height="8">
        <path fill="#666" d="M 5 1.5 L 14 1.5 L 9.5 7 z" />
      </svg>
      <ul className="toolbar-menu-items">
        {children}
      </ul>
    </a>
  );
}

ToolbarMenu.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
};

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
