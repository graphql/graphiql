/** @jsx jsx */
import { jsx } from 'theme-ui';
import { Resizer } from './Resizer';

export default { title: 'Resizer' };

export const resizer = () => (
  <Resizer
    border="bottom"
    handlerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
    <main>{`Main content`}</main>
  </Resizer>
);
