/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { FC } from 'react';

/**
 * ToolbarGroup
 *
 * A group of associated controls.
 */
export const ToolbarGroup: FC = ({ children }) => {
  return <div className="toolbar-button-group">{children}</div>;
};
