import React from 'react';
import Layout, { LayoutNavPanel } from './Layout';
import Nav from './Nav';
import { Card, CardRow, CardRowText } from './Layout/LayoutBlocks';

export default { title: 'Layout' };

export const withDefaultSlots = () => <Layout />;
export const withCustomNav = () => <Layout nav={<Nav />} />;

export const withManySidebars = () => (
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

export const withFullScreenPanel = () => (
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
