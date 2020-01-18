import List, { ListRow } from '../List/List';
import Tabs from './Tabs';
import React, { useState } from 'react';
import { layout } from '../themes/decorators';

export default { title: 'Tabbar', decorators: [layout] };

// eslint-disable-next-line react/prop-types
const ManagedTabs = ({ tabs }) => {
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
