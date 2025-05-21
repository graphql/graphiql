'use client'

import { FC } from 'react';
import dynamic from 'next/dynamic'
import 'graphiql/style.css';

// dynamically import our React component
const GraphiQL = dynamic(
  async () => {
    // await import('./worker');
    return import('graphiql').then(mod => mod.GraphiQL);
  },
  { ssr: false }
);


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
