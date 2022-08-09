/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import { PropsWithChildren } from 'react';

import { ReactNodeLike } from '../../types';

interface NavProps {
  children: Array<ReactNodeLike>;
}

interface NavItemProps {
  label: string;
  active?: boolean;
}

export const NavItem = ({
  active,
  label,
  children,
}: PropsWithChildren<NavItemProps>) => (
  <button
    aria-label={label}
    sx={{
      color: active ? '#E10098' : '#8c8c8c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      willChange: 'transform',
      transition: 'transform .2s ease',
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
      ':hover': {
        transform: 'scale(1.1)',
      },
      ':active': {
        transform: 'scale(.95)',
      },
    }}
  >
    {children}
  </button>
);

export const Nav = ({ children }: NavProps) => {
  return (
    <nav
      sx={{
        display: 'grid',
        gridAutoFlow: 'row',
        gridAutoRows: '2em',
        fontSize: '3em',
      }}
    >
      {children}
    </nav>
  );
};
