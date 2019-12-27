/** @jsx jsx */
import { jsx } from 'theme-ui';
import List, { ListRow } from './List';
import { SectionHeader, Explainer } from './Type';

export default { title: 'Type' };

export const type = () => (
  <List>
    <ListRow>
      <SectionHeader>{'Title'}</SectionHeader>
    </ListRow>
    <ListRow>
      <Explainer>{'Small explainer text'}</Explainer>
    </ListRow>
    <ListRow>{'Normal text'}</ListRow>
  </List>
);
