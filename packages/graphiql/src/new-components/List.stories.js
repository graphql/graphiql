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
      <ListRow>
        {
          'Lists are a vertical stack of components and form the basis of most modules. This one is very long'
        }
      </ListRow>
      <ListRow flex>
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
      <ListRow>{'Title'}</ListRow>
      <ListRow>{'Navigation'}</ListRow>
      <ListRow>{'Search'}</ListRow>
      <ListRow>{'Filter'}</ListRow>
      <ListRow flex>
        {'Actual content'}
        {longText}
        {'Actual content ends here'}
      </ListRow>
      <ListRow>{'Footer'}</ListRow>
      <ListRow>{'Footers footer'}</ListRow>
    </List>
  </div>
);
