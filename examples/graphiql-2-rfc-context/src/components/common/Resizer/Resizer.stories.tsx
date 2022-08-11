/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import { Resizer } from './Resizer';

export default { title: 'Resizer' };

export const resizer = () => (
  <Resizer
    border="bottom"
    handlerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
  >
    <main>Main content</main>
  </Resizer>
);
