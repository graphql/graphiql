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
