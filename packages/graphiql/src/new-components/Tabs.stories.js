import List, { ListRow } from './List';
import Tabs from './Tabs';
import React, { useState } from 'react';

export default { title: 'Tabs' };

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
          'A nested',
          <>
            Component{' '}
            <small style={{ background: 'yellow', padding: 3 }}>hello</small>
          </>,
        ]}
      />
    </ListRow>
  </List>
);
