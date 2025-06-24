'use client';

import type { FC } from 'react';
import dynamic from 'next/dynamic';

// dynamically import our GraphiQL component
const DynamicEditor = dynamic(() => import('../editor'), { ssr: false });

/**
 * Setup Monaco Editor workers for Webpack/Turbopack projects like Next.js.
 */
globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    console.info('setup-workers/webpack', { label });
    switch (label) {
      case 'json':
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/language/json/json.worker.js',
            import.meta.url,
          ),
        );
      case 'graphql':
        return new Worker(
          new URL('monaco-graphql/esm/graphql.worker.js', import.meta.url),
        );
      case 'typescript':
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/language/typescript/ts.worker.js',
            import.meta.url,
          ),
        );
    }
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
    );
  },
};

const Page: FC = () => {
  return (
    <div id="root">
      <DynamicEditor />
    </div>
  );
};

export default Page;
