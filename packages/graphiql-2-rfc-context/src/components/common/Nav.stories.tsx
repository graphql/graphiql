/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

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
    <NavItem label="Pig’s nose">🐽</NavItem>
    <NavItem label="Farmer">👨‍🌾</NavItem>
    <NavItem label="Bee">🐝</NavItem>
  </Nav>
);
