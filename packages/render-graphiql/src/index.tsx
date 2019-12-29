import * as React from 'react';
import ReactDOM from 'react-dom';

import { default as GraphiQL } from 'graphiql';

import { RenderGraphiQLOptions } from './types';

import { generateFetcher } from './fetcher';

export default function renderGraphiQL({
  containerId,
  fetcher,
  ...opts
}: RenderGraphiQLOptions): void {
  const el = containerId ? document.getElementById(containerId) : document.body;
  ReactDOM.render(
    <GraphiQL {...opts} fetcher={fetcher || generateFetcher(opts)} />,
    el,
  );
}

export * from './types';
