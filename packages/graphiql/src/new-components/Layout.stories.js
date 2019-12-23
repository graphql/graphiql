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
      <LayoutNavPanel key="first" size="sidebar">
        <Card>
          <CardRow>
            <CardRowText>{'First panel'}</CardRowText>
          </CardRow>
        </Card>
      </LayoutNavPanel>,
      <LayoutNavPanel key="second" size="aside">
        <Card>
          <CardRow>
            <CardRowText>{'Second panel'}</CardRowText>
          </CardRow>
        </Card>
      </LayoutNavPanel>,
      <LayoutNavPanel key="third" size="aside">
        <Card>
          <CardRow>
            <CardRowText>{'Third aside'}</CardRowText>
          </CardRow>
        </Card>
      </LayoutNavPanel>,
    ]}
  />
);

export const withFullScreenPanel = () => (
  <Layout
    navPanels={[
      <LayoutNavPanel key="first" size="full-screen">
        <Card>
          <CardRow>
            <CardRowText>{'Full screen panel'}</CardRowText>
          </CardRow>
        </Card>
      </LayoutNavPanel>,
    ]}
  />
);
