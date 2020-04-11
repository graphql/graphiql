import List, { ListRow } from '../List';
import Tabs from './Tabs';
import React, { useState } from 'react';
import { layout } from '../themes/decorators';
import { ReactNodeLike } from '../../types';

export default { title: 'Tabbar', decorators: [layout] };

const ManagedTabs = ({ tabs }: { tabs: Array<ReactNodeLike> }) => {
  const [active, setActive] = useState(0);
  return <Tabs active={active} tabs={tabs} onChange={setActive} />;
};

export const Tabbar = () => (
  <List>
    <ListRow>
      <ManagedTabs tabs={['One', 'Two', 'Three']} />
    </ListRow>
    <ListRow>
      <ManagedTabs
        tabs={[
          'With',
          'a',
          'nested',
          <>
            {'Component '}
            <small style={{ background: 'yellow', padding: 3 }}>{'2'}</small>
          </>,
        ]}
      />
    </ListRow>
    <ListRow flex>
      <div style={{ height: '100px', display: 'grid' }}>
        <ManagedTabs tabs={['Very tall', 'tabs']} />
      </div>
    </ListRow>
  </List>
);
