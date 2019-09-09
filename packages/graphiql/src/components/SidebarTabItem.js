/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * ToolbarButton
 *
 * A button to use within the Toolbar.
 */
export const SidebarTabItem = ({ title, children }) => {
  return <div className="tab-item" title={title}>{children}</div>;
};

SidebarTabItem.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.object,
};
