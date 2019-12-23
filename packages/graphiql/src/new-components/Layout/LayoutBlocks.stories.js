import React from 'react';
import { Card, CardRow } from './LayoutBlocks';

export default { title: 'Layout Cards' };

export const withFlexChild = () => (
  <div style={{ height: '50vh' }}>
    <Card>
      <CardRow>{'Title'}</CardRow>
      <CardRow flex>
        {'This child is looooong'}
        {Array(300)
          .fill('scroll')
          .map((c, i) => (
            <div key={i}>{c}</div>
          ))}
      </CardRow>
    </Card>
  </div>
);
