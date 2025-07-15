'use client';

import type { FC } from 'react';
import { GraphiQL } from 'graphiql';
import 'graphiql/setup-workers/webpack';
import 'graphiql/style.css';

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

export const GraphiQLPage: FC = () => {
  return <GraphiQL fetcher={fetcher} />;
};
