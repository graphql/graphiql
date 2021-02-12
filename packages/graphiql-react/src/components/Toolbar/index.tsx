/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import WithDividers from './support/WithDividers';
import { PropsWithChildren } from 'react';
import { JustifyContentProperty } from 'csstype';

export type ToolbarPropTypes = PropsWithChildren<{
  justifyContent?: JustifyContentProperty;
}>;

const Toolbar = ({
  children,
  justifyContent = 'space-between',
}: ToolbarPropTypes) => {
  const needsExtraPadding = !justifyContent.includes('space');
  return (
    <div
      sx={{
        overflow: 'auto',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent,
      }}>
      {needsExtraPadding ? (
        <WithDividers padding>{children}</WithDividers>
      ) : (
        children
      )}
    </div>
  );
};

export default Toolbar;
