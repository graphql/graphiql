import List, { ListRow } from './List';
import Tabs from './Tabs';
import React, { useState } from 'react';

export default { title: 'Tabs' };

// eslint-disable-next-line react/prop-types
const ManagedTabs = ({ tabs }) => {
  const [active, setActive] = useState(1);
  return <Tabs active={active} tabs={tabs} onChange={setActive} />;
};

export const Tabbar = () => (
  <List>
    <ListRow padding={false}>
      <ManagedTabs tabs={['First', 'Second', 'Third']} />
    </ListRow>
    <ListRow padding={false}>
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
    <ListRow padding={false}>
      <div style={{ height: 100 }}>
        <ManagedTabs tabs={['Very tall', 'tabs']} />
      </div>
    </ListRow>
  </List>
);
