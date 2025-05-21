'use client';

import type { FC } from 'react';
import dynamic from 'next/dynamic';

// dynamically import our GraphiQL component
const DynamicEditor = dynamic(() => import('../editor'), { ssr: false });

const Page: FC = () => {
  return (
    <div id="__next">
      <DynamicEditor />
    </div>
  );
};

export default Page;
