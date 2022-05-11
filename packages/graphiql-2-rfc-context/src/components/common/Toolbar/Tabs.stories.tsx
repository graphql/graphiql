/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import List, { ListRow } from '../List';
import Tabs from './Tabs';
import React, { useState } from 'react';
import { layout } from '../themes/decorators';
import { ReactNodeLike } from '../../../types';

export default { title: 'Tabbar', decorators: [layout] };

const ManagedTabs = ({
  tabs,
  children,
}: {
  tabs: Array<ReactNodeLike>;
  children: Array<ReactNodeLike>;
}) => {
  const [active, setActive] = useState(0);
  return (
    <Tabs active={active} tabs={tabs} onChange={setActive}>
      {children}
    </Tabs>
  );
};

export const Tabbar = () => (
  <List>
    <ListRow>
      <ManagedTabs tabs={['One', 'Two', 'Three']}>
        <p>One</p>
        <p>Two</p>
        <p>Three</p>
      </ManagedTabs>
    </ListRow>
    <ListRow>
      <ManagedTabs
        tabs={[
          'With',
          'a',
          'nested',
          <>
            {'Component '}
            <small style={{ background: 'yellow', padding: 3 }}>2</small>
          </>,
        ]}>
        <p>With</p>
        <p>a</p>
        <p>nested</p>
        <p>component</p>
      </ManagedTabs>
    </ListRow>
    <ListRow flex>
      <div style={{ height: '100px', display: 'grid' }}>
        <ManagedTabs tabs={['Very tall', 'tabs']}>
          <p>a</p>
          <p>b</p>
        </ManagedTabs>
      </div>
    </ListRow>
  </List>
);
