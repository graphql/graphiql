/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';


/**
 * ToolbarGroup
 *
 * A group of associated controls.
 */
export function ToolbarGroup({ children }) {
  return (
    <div className="toolbar-button-group">
      {children}
    </div>
  );
}
