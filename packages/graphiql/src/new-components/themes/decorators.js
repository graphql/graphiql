import React from 'react';

const styles = {
  maxWidth: '60em',
  margin: '5em auto',
  border: '1px solid #eee',
};

export const layout = storyFn => <div style={styles}>{storyFn()}</div>;
