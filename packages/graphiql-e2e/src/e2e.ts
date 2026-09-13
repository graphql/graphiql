'use no memo';

import React, { ComponentProps } from 'react';
import ReactDOM from 'react-dom/client';
import { createTransport } from '@graphiql/toolkit';
import type { TabsState } from '@graphiql/react';
import { createClient } from 'graphql-ws';
import { GraphiQL } from 'graphiql';
import 'graphiql/style.css';
import 'graphiql/setup-workers/vite';
import type { Params } from './params.js';

/**
 * GraphiQL Example
 *
 * This is a simple example that provides a primitive query string parser on top of GraphiQL props
 * It is used by:
 * - the netlify demo
 * - end-to-end tests
 * - vite dev server
 */

// Parse the search string to get url parameters.
const parameters: Params = Object.fromEntries(
  new URLSearchParams(location.search).entries(),
);

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
function onEditQuery(newQuery: string): void {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables: string): void {
  parameters.variables = newVariables;
  updateURL();
}

function onEditHeaders(newHeaders: string): void {
  parameters.headers = newHeaders;
  updateURL();
}

function onTabChange(tabsState: TabsState): void {
  const activeTab = tabsState.tabs[tabsState.activeTabIndex]!;
  parameters.query = activeTab.query ?? undefined;
  parameters.variables = activeTab.variables ?? undefined;
  parameters.headers = activeTab.headers ?? undefined;
  updateURL();
}

function confirmCloseTab(index: number): boolean {
  // eslint-disable-next-line no-alert
  return confirm(`Are you sure you want to close tab with index ${index}?`);
}

function onPrettifyQuery(query: string): string {
  return query.replaceAll(/([ \n])+/g, ' ');
}

function updateURL(): void {
  const newSearch = Object.entries(parameters)
    .filter(([_key, value]) => value)
    .map(
      ([key, value]) =>
        encodeURIComponent(key) + '=' + encodeURIComponent(value),
    )
    .join('&');
  history.replaceState(null, '', `?${newSearch}`);
}

function getSchemaUrl(): string {
  if (isLocal()) {
    return '/graphql';
  }
  return '/.netlify/functions/graphql';
}

function isLocal(): boolean {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

// Render <GraphiQL /> into the body.
// See the README in the top level of this module to learn more about
// how you can customize GraphiQL by providing different values or
// additional child elements.
const root = ReactDOM.createRoot(document.getElementById('graphiql')!);

const props: ComponentProps<typeof GraphiQL> = {
  transport: createTransport({
    url: getSchemaUrl(),
    supportedMethods: ['GET', 'POST', 'QUERY'],
    subscriptionClient: isLocal()
      ? createClient({
          url: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/subscriptions`,
        })
      : undefined,
  }),

  initialQuery: parameters.query,
  initialVariables: parameters.variables,
  initialHeaders: parameters.headers,

  defaultQuery: parameters.defaultQuery,
  defaultHeaders: parameters.defaultHeaders,

  onEditQuery,
  onEditVariables,
  onEditHeaders,
  defaultEditorToolsVisibility: true,
  isHeadersEditorEnabled: true,
  shouldPersistHeaders: true,
  inputValueDeprecation: true,
  confirmCloseTab:
    parameters.confirmCloseTab === 'true' ? confirmCloseTab : undefined,
  onPrettifyQuery:
    parameters.onPrettifyQuery === 'true' ? onPrettifyQuery : undefined,
  onTabChange,
  forcedTheme: parameters.forcedTheme,
  defaultTheme: parameters.defaultTheme,
  customScalarSchemas: {
    JSON: {},
  },
};

function App() {
  return React.createElement(
    React.StrictMode,
    null,
    React.createElement(GraphiQL, props),
  );
}

root.render(React.createElement(App));
