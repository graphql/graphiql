import React from 'react';
import Nav from './Nav';
import List, { ListRow } from './List';
import { useThemeLayout } from './themes/provider';

const explorer = {
  input: (
    <List>
      <ListRow>{'Input'}</ListRow>
    </List>
  ),
  response: (
    <List>
      <ListRow>{'Response'}</ListRow>
    </List>
  ),
  console: (
    <List>
      <ListRow>{'Console/Inspector'}</ListRow>
    </List>
  ),
};
const nav = <Nav />;
const slots = { nav, explorer };

export default { title: 'Layout' };

export const withSlots = () => {
  const Layout = useThemeLayout();
  return <Layout {...slots} />;
};

export const withManySidebars = () => {
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
              <ListRow>{'Sidebar'}</ListRow>
            </List>
          ),
        },
        {
          key: 2,
          size: 'aside',
          component: (
            <List>
              <ListRow>{'aside'}</ListRow>
            </List>
          ),
        },
        {
          key: 3,
          size: 'aside',
          component: (
            <List>
              <ListRow>{'Another aside'}</ListRow>
            </List>
          ),
        },
      ]}
    />
  );
};

export const withFullScreenPanel = () => {
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
              <ListRow>{'Woooo'}</ListRow>
            </List>
          ),
        },
      ]}
    />
  );
};

export const withStringsOnly = () => {
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
