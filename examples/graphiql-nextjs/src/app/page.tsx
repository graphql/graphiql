'use client';

import type { FC } from 'react';
import dynamic from 'next/dynamic';
import 'graphiql/setup-workers/webpack';
import 'graphiql/style.css';

// dynamically import our GraphiQL component
const GraphiQL = dynamic(() => import('graphiql').then(mod => mod.GraphiQL), {
  ssr: false,
});

async function fetcher(graphQLParams: Record<string, unknown>) {
  const response = await fetch('https://graphql.earthdata.nasa.gov/api', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(graphQLParams),
  });
  return response.json();
}

const Page: FC = () => {
  return <GraphiQL fetcher={fetcher} />;
};

export default Page;
