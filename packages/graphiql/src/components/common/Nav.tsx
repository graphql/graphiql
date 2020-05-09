/** @jsx jsx */
import { jsx } from 'theme-ui';
import { PropsWithChildren } from 'react';

import Logo from './Logo';

interface NavItemProps {
  label: string;
  active?: boolean;
}

const NavItem = ({
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
    }}>
    {children}
  </button>
);

const Nav = () => {
  return (
    <nav
      sx={{
        display: 'grid',
        gridAutoFlow: 'row',
        gridAutoRows: '2em',
        fontSize: '3em',
      }}>
      <NavItem label="Schema">
        <Logo size="1em" />
      </NavItem>
      <NavItem label="Pig’s nose">{'🐽'}</NavItem>
      <NavItem label="Farmer">{'👨‍🌾'}</NavItem>
      <NavItem label="Bee">{'🐝'}</NavItem>
    </nav>
  );
};

export default Nav;
