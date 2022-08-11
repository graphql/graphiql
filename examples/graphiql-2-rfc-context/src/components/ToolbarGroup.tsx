/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React, { ReactNode } from 'react';

type ToolbarGroupProps = {
  children: ReactNode;
};

/**
 * ToolbarGroup
 *
 * A group of associated controls.
 */
export function ToolbarGroup({ children }: ToolbarGroupProps) {
  return <div className="toolbar-button-group">{children}</div>;
}
