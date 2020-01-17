/** @jsx jsx */
import { jsx } from 'theme-ui';
import List, { ListRow } from './List';

export default { title: 'Lists' };

const longText = Array(300)
  .fill('scroll')
  .map((c, i) => <div key={i}>{c}</div>);

export const withFlexChild = () => (
  <div style={{ height: '100vh', display: 'grid' }}>
    <List>
      <ListRow padding>
        <div>
          {
            'Lists are a vertical stack of components and form the basis of most modules. This one is very long'
          }
        </div>
      </ListRow>
      <ListRow padding flex>
        {'You normally want 1 flex area that grows forever like this one'}
        {longText}
        {'the end'}
      </ListRow>
    </List>
  </div>
);

export const withStackedRows = () => (
  <div style={{ height: '100vh', display: 'grid' }}>
    <List>
      <ListRow padding>{'Title'}</ListRow>
      <ListRow padding>{'Navigation'}</ListRow>
      <ListRow padding>{'Search'}</ListRow>
      <ListRow padding>{'Filter'}</ListRow>
      <ListRow padding flex>
        {'Actual content'}
        {longText}
        {'Actual content ends here'}
      </ListRow>
      <ListRow padding>{'Footer'}</ListRow>
      <ListRow padding>{'Footers footer'}</ListRow>
    </List>
  </div>
);
