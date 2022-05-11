/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import { Nav, NavItem } from './Nav';
import List, { ListRow } from './List';
import { useThemeLayout } from './themes/provider';
import Logo from './Logo';

const explorer = {
  input: (
    <List>
      <ListRow>Input</ListRow>
    </List>
  ),
  response: (
    <List>
      <ListRow>Response</ListRow>
    </List>
  ),
  console: (
    <List>
      <ListRow>Console/Inspector</ListRow>
    </List>
  ),
};
const nav = (
  <Nav>
    <NavItem label="Schema">
      <Logo size="1em" />
    </NavItem>
    <NavItem label="Pig’s nose">🐽</NavItem>
    <NavItem label="Farmer">👨‍🌾</NavItem>
    <NavItem label="Bee">🐝</NavItem>
  </Nav>
);
const slots = { nav, explorer };

export default { title: 'Layout' };

export const WithSlots = () => {
  const Layout = useThemeLayout();
  return <Layout {...slots} />;
};

export const WithManySidebars = () => {
  const Layout = useThemeLayout();
  return (
    <Layout
      {...slots}
      navPanels={[
        {
          key: 1,
          size: 'sidebar',
          component: (
            <List>
              <ListRow>Sidebar</ListRow>
            </List>
          ),
        },
        {
          key: 2,
          size: 'aside',
          component: (
            <List>
              <ListRow>aside</ListRow>
            </List>
          ),
        },
        {
          key: 3,
          size: 'aside',
          component: (
            <List>
              <ListRow>Another aside</ListRow>
            </List>
          ),
        },
      ]}
    />
  );
};

export const WithFullScreenPanel = () => {
  const Layout = useThemeLayout();
  return (
    <Layout
      {...slots}
      navPanels={[
        {
          key: 1,
          size: 'full-screen',
          component: (
            <List>
              <ListRow>Woooo</ListRow>
            </List>
          ),
        },
      ]}
    />
  );
};

export const WithStringsOnly = () => {
  const Layout = useThemeLayout();
  return (
    <Layout
      {...{
        explorer: {
          input: 'input',
          response: 'response',
          console: 'console',
        },
        nav: 'nav',
        navPanels: [
          {
            component: 'sidebar',
            key: 'sidebar',
            size: 'sidebar',
          },
        ],
      }}
    />
  );
};
