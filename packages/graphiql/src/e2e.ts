'use no memo';

import React, { ComponentProps } from 'react';
import ReactDOM from 'react-dom/client';
import GraphiQL from './cdn';
import type { TabsState, Theme } from '@graphiql/react';
import './style.css';

/**
 * CDN GraphiQL Example
 *
 * This is a simple example that provides a primitive query string parser on top of GraphiQL props
 * It assumes a global umd GraphiQL, which would be provided by an index.html in the default example
 *
 * It is used by:
 * - the netlify demo
 * - end-to-end tests
 * - vite dev server
 */

interface Params {
  query?: string;
  variables?: string;
  headers?: string;
  confirmCloseTab?: 'true';
  onPrettifyQuery?: 'true';
  forcedTheme?: 'light' | 'dark' | 'system';
  defaultQuery?: string;
  defaultTheme?: Theme;
  defaultHeaders?: string;
}

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
  const isDev = /localhost$/.test(location.hostname);

  if (isDev) {
    return '/graphql';
  }
  return '/.netlify/functions/graphql';
}

// Render <GraphiQL /> into the body.
// See the README in the top level of this module to learn more about
// how you can customize GraphiQL by providing different values or
// additional child elements.
const root = ReactDOM.createRoot(document.getElementById('graphiql')!);
const graphqlVersion = GraphiQL.GraphQL.version;

const props: ComponentProps<typeof GraphiQL> = {
  fetcher: GraphiQL.createFetcher({
    url: getSchemaUrl(),
    subscriptionUrl: 'ws://localhost:8081/subscriptions',
  }),
  query: parameters.query,
  variables: parameters.variables,
  headers: parameters.headers,
  defaultHeaders: parameters.defaultHeaders,
  onEditQuery,
  onEditVariables,
  onEditHeaders,
  defaultEditorToolsVisibility: true,
  isHeadersEditorEnabled: true,
  shouldPersistHeaders: true,
  inputValueDeprecation: !graphqlVersion.includes('15.5'),
  confirmCloseTab:
    parameters.confirmCloseTab === 'true' ? confirmCloseTab : undefined,
  onPrettifyQuery:
    parameters.onPrettifyQuery === 'true' ? onPrettifyQuery : undefined,
  onTabChange,
  forcedTheme: parameters.forcedTheme,
  defaultQuery: parameters.defaultQuery,
  defaultTheme: parameters.defaultTheme,
};

root.render(
  // TODO: enable strict mode after monaco-editor migration
  // <StrictMode>
  React.createElement(GraphiQL, props),
  // </StrictMode>,
);
