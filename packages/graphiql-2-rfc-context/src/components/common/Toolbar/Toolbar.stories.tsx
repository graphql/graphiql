/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import List, { ListRow } from '../List';
import Tabs from './Tabs';
import React from 'react';
import Toolbar from './index';
import Content from './Content';
import { layout } from '../themes/decorators';

export default { title: 'Toolbar', decorators: [layout] };

export const Basic = () => (
  <List>
    <ListRow padding>
      <p>
        Toolbars group together widgets in a flexbox. You can customize what
        type of justification to use and if elements go together it&apos;ll add
        dividers between them
      </p>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="center">
        <Content>Some text</Content>
        <Content>Some text</Content>
        <Content>Some text</Content>
      </Toolbar>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="flex-start">
        <Content>Some text</Content>
        <Content>Some text</Content>
        <Content>Some text</Content>
      </Toolbar>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="flex-end">
        <Content>Some text</Content>
        <Content>Some text</Content>
        <Content>Some text</Content>
      </Toolbar>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="space-between">
        <Content>Some text</Content>
        <Content>Some text</Content>
        <Content>Some text</Content>
      </Toolbar>
    </ListRow>
  </List>
);

export const ToolbarWithTabs = () => (
  <List>
    <ListRow padding>
      <p>
        The dividers don&apos;t nest so if you have tabs inside a toolbar the
        tabs won&apos;t get dividers
      </p>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="center">
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
      </Toolbar>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="flex-start">
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
      </Toolbar>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="flex-end">
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
      </Toolbar>
    </ListRow>
    <ListRow>
      <Toolbar justifyContent="space-between">
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
        <Tabs active={2} tabs={['First', 'Second', 'Third']} />
      </Toolbar>
    </ListRow>
  </List>
);
