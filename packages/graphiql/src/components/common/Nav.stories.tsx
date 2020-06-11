/** @jsx jsx */

import { jsx } from 'theme-ui';
import { NavItem, Nav } from './Nav';
import { layout } from './themes/decorators';

import Logo from './Logo';

export default { title: 'Navbar', decorators: [layout] };

export const NavBar = () => (
  <Nav>
    <NavItem label="Schema">
      <Logo size="1em" />
    </NavItem>
    <NavItem label="Pig’s nose">{'🐽'}</NavItem>
    <NavItem label="Farmer">{'👨‍🌾'}</NavItem>
    <NavItem label="Bee">{'🐝'}</NavItem>
  </Nav>
);
