import React from 'react';
import Nav from './Nav';
import { Card, CardRow, CardRowText } from './Card';
import { useThemeLayout } from './themes/provider';

export default { title: 'Layout' };

export const withDefaultSlots = () => {
  const Layout = useThemeLayout();
  return <Layout />;
};

export const withCustomNav = () => {
  const Layout = useThemeLayout();
  return <Layout nav={<Nav />} />;
};

export const withManySidebars = () => {
  const Layout = useThemeLayout();
  return (
    <Layout
      navPanels={[
        {
          key: 1,
          size: 'sidebar',
          component: (
            <Card>
              <CardRow>
                <CardRowText>{'Sidebar'}</CardRowText>
              </CardRow>
            </Card>
          ),
        },
        {
          key: 2,
          size: 'aside',
          component: (
            <Card>
              <CardRow>
                <CardRowText>{'aside'}</CardRowText>
              </CardRow>
            </Card>
          ),
        },
        {
          key: 3,
          size: 'aside',
          component: (
            <Card>
              <CardRow>
                <CardRowText>{'Another aside'}</CardRowText>
              </CardRow>
            </Card>
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
      navPanels={[
        {
          key: 1,
          size: 'full-screen',
          component: (
            <Card>
              <CardRow>
                <CardRowText>{'Woooo'}</CardRowText>
              </CardRow>
            </Card>
          ),
        },
      ]}
    />
  );
};
