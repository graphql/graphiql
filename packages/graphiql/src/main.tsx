/**
 * UMD GraphiQL Example
 *
 * This is a simple example that provides a primitive query string parser on top of GraphiQL props
 * It assumes a global umd GraphiQL, which would be provided by an index.html in the default example
 *
 * It is used by:
 * - the netlify demo
 * - end to end tests
 * - webpack dev server
 */

import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from './cdn';
import './css/app.css';
import './css/codemirror.css';
import './css/foldgutter.css';
import './css/info.css';
import './css/jump.css';
import './css/lint.css';
import './css/loading.css';
import './css/show-hint.css';

import './css/doc-explorer.css';
import './css/history.css';

// Parse the search string to get url parameters.
const search = window.location.search;
const parameters = {};
search
  .substr(1)
  .split('&')
  .forEach(function (entry) {
    const eq = entry.indexOf('=');
    if (eq >= 0) {
      // @ts-expect-error
      parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(
        entry.slice(eq + 1),
      );
    }
  });

// If variables was provided, try to format it.
// @ts-expect-error
if (parameters.variables) {
  try {
    // @ts-expect-error
    parameters.variables = JSON.stringify(
      // @ts-expect-error
      JSON.parse(parameters.variables),
      null,
      2,
    );
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// If headers was provided, try to format it.
// @ts-expect-error
if (parameters.headers) {
  try {
    // @ts-expect-error
    parameters.headers = JSON.stringify(
      // @ts-expect-error
      JSON.parse(parameters.headers),
      null,
      2,
    );
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
// @ts-expect-error
function onEditQuery(newQuery) {
  // @ts-expect-error
  parameters.query = newQuery;
  updateURL();
}

// @ts-expect-error
function onEditVariables(newVariables) {
  // @ts-expect-error
  parameters.variables = newVariables;
  updateURL();
}

// @ts-expect-error
function onEditHeaders(newHeaders) {
  // @ts-expect-error
  parameters.headers = newHeaders;
  updateURL();
}

// @ts-expect-error
function onEditOperationName(newOperationName) {
  // @ts-expect-error
  parameters.operationName = newOperationName;
  updateURL();
}

// @ts-expect-error
function onTabChange(tabsState) {
  const activeTab = tabsState.tabs[tabsState.activeTabIndex];
  // @ts-expect-error
  parameters.query = activeTab.query;
  // @ts-expect-error
  parameters.variables = activeTab.variables;
  // @ts-expect-error
  parameters.headers = activeTab.headers;
  // @ts-expect-error
  parameters.operationName = activeTab.operationName;
  updateURL();
}

function updateURL() {
  const newSearch =
    '?' +
    Object.keys(parameters)
      .filter(function (key) {
        // @ts-expect-error
        return Boolean(parameters[key]);
      })
      .map(function (key) {
        return (
          // @ts-expect-error
          encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key])
        );
      })
      .join('&');
  // @ts-expect-error
  history.replaceState(null, null, newSearch);
}

function getSchemaUrl() {
  const isDev = window.location.hostname.match(/localhost$/);

  if (isDev) {
    // This supports an e2e test which ensures that invalid schemas do not load.
    // @ts-expect-error
    if (parameters.bad && parameters.bad === 'true') {
      return '/bad/graphql';
    } else {
      return '/graphql';
    }
  }
  return '/.netlify/functions/schema-demo';
}

// Render <GraphiQL /> into the body.
// See the README in the top level of this module to learn more about
// how you can customize GraphiQL by providing different values or
// additional child elements.
ReactDOM.render(
  React.createElement(GraphiQL, {
    // @ts-expect-error
    fetcher: GraphiQL.createFetcher({
      url: getSchemaUrl(),
      subscriptionUrl: 'ws://localhost:8081/subscriptions',
    }),
    // @ts-expect-error
    query: parameters.query,
    // @ts-expect-error
    variables: parameters.variables,
    // @ts-expect-error
    headers: parameters.headers,
    // @ts-expect-error
    operationName: parameters.operationName,
    onEditQuery,
    onEditVariables,
    onEditHeaders,
    defaultSecondaryEditorOpen: true,
    onEditOperationName,
    headerEditorEnabled: true,
    shouldPersistHeaders: true,
    inputValueDeprecation: true,
    tabs: {
      onTabChange,
    },
  }),
  document.getElementById('graphiql'),
);
