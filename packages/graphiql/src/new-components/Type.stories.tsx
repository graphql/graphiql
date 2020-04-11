/** @jsx jsx */
import { jsx } from 'theme-ui';
import List, { ListRow } from './List/List';
import { SectionHeader, Explainer } from './Type';
import { layout } from './themes/decorators';

export default { title: 'Type', decorators: [layout] };

export const type = () => (
  <List>
    <ListRow padding>
      <SectionHeader>{'Title'}</SectionHeader>
    </ListRow>
    <ListRow padding>
      <Explainer>{'Small explainer text'}</Explainer>
    </ListRow>
    <ListRow padding>{'Normal text'}</ListRow>
  </List>
);
