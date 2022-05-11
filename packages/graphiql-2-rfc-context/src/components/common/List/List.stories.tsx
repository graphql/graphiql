/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import List, { ListRow } from './index';

export default { title: 'Lists' };

const longText = Array(300)
  .fill('scroll')
  .map((c, i) => <div key={i}>{c}</div>);

export const WithFlexChild = () => (
  <div style={{ height: '100vh', display: 'grid' }}>
    <List>
      <ListRow padding>
        <div>
          Lists are a vertical stack of components and form the basis of most
          modules. This one is very long
        </div>
      </ListRow>
      <ListRow padding flex>
        You normally want 1 flex area that grows forever like this one
        {longText}
        the end
      </ListRow>
    </List>
  </div>
);

export const WithStackedRows = () => (
  <div style={{ height: '100vh', display: 'grid' }}>
    <List>
      <ListRow padding>Title</ListRow>
      <ListRow padding>Navigation</ListRow>
      <ListRow padding>Search</ListRow>
      <ListRow padding>Filter</ListRow>
      <ListRow padding flex>
        Actual content
        {longText}
        Actual content ends here
      </ListRow>
      <ListRow padding>Footer</ListRow>
      <ListRow padding>Footers footer</ListRow>
    </List>
  </div>
);
