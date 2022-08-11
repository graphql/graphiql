/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import List, { ListRow } from './List';
import { SectionHeader, Explainer } from './Type';
import { layout } from './themes/decorators';

export default { title: 'Type', decorators: [layout] };

export const type = () => (
  <List>
    <ListRow padding>
      <SectionHeader>Title</SectionHeader>
    </ListRow>
    <ListRow padding>
      <Explainer>Small explainer text</Explainer>
    </ListRow>
    <ListRow padding>Normal text</ListRow>
  </List>
);
