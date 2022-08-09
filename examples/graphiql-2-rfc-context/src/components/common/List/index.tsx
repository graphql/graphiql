/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx, SxStyleProp } from 'theme-ui';
import { PropsWithChildren } from 'react';

export type ListRowPropTypes = PropsWithChildren<{
  flex?: boolean;
  padding?: boolean;
}>;

const ListRow = ({
  children,
  flex = false,
  padding = false,
}: ListRowPropTypes) => (
  <div
    sx={
      {
        overflow: 'auto',
        flex: flex && '1 1 auto',
        padding: padding ? ({ spaces }) => spaces.rowPadding : undefined,
        minHeight: ({ spaces }) => spaces.rowMinHeight,
      } as SxStyleProp
    }
  >
    {children}
  </div>
);

export type ListPropTypes = PropsWithChildren<{}>;

const List = ({ children }: ListPropTypes) => (
  <div
    sx={{
      backgroundColor: 'cardBackground',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      '> *:not(:first-of-type)': {
        borderTop: theme => `1px solid ${theme.colors.border}`,
      },
      '> *': {
        flex: '0 0 auto',
      },
    }}
  >
    {children}
  </div>
);

export default List;
export { ListRow };
