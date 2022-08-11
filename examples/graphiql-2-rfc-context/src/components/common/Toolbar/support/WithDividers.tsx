/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx, SxStyleProp } from 'theme-ui';
import { Children, DetailedHTMLProps, HTMLAttributes } from 'react';

export type DividerProps = { innerSx: SxStyleProp };

const Divider = ({ innerSx }: DividerProps) => (
  <div
    data-is-divider
    aria-hidden
    sx={{
      ...innerSx,
      background: ({ colors }) => colors.border,
      width: '1px',
    }}
  />
);

export type WithDividersPropTypes = { padding?: boolean } & DetailedHTMLProps<
  HTMLAttributes<HTMLUListElement>,
  HTMLUListElement
>;

const WithDividers = ({
  children,
  padding = false,
  ...props
}: WithDividersPropTypes) => {
  return (
    <ul
      data-contains-divider
      {...props}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        '[data-contains-divider] [data-is-divider]': {
          display: 'none',
        },
      }}
    >
      {Children.map(children, (child, index) => {
        const isFirst = index === 0;
        return (
          <li
            sx={{
              position: 'relative',
              display: 'grid',
              marginLeft:
                padding && !isFirst
                  ? ({ spaces }) => spaces.rowPadding * 2
                  : undefined,
            }}
          >
            {!isFirst && (
              <Divider
                innerSx={{
                  position: 'absolute',
                  top: ({ space }) => space[2],
                  bottom: ({ space }) => space[2],
                  left:
                    padding && !isFirst
                      ? ({ spaces }) => spaces.rowPadding * -1
                      : 0,
                }}
              />
            )}
            {child}
          </li>
        );
      })}
    </ul>
  );
};

export default WithDividers;
