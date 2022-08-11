/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { ReactNodeLike } from '../../../types';

const styles = {
  maxWidth: '60em',
  margin: '5em auto',
  border: '1px solid #eee',
};

export const layout = (storyFn: () => ReactNodeLike) => (
  <div style={styles}>{storyFn()}</div>
);
