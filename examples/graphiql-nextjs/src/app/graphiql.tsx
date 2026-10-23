'use client';

import type { FC } from 'react';
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import 'graphiql/setup-workers/webpack';
import 'graphiql/style.css';

const transport = createTransport({
  url: 'https://graphql.earthdata.nasa.gov/api',
});

export const GraphiQLPage: FC = () => {
  return <GraphiQL transport={transport} />;
};
