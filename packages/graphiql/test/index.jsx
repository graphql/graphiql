
   
import React from 'react'
import ReactDOM from 'react-dom'
import GraphiQL from '../src'
import '../graphiql.css'
/**
 * This GraphiQL example illustrates how to use some of GraphiQL's props
 * in order to enable reading and updating the URL parameters, making
 * link sharing of queries a little bit easier.
 *
 * This is only one example of this kind of feature, GraphiQL exposes
 * various React params to enable interesting integrations.
 */

// Parse the search string to get url parameters.
const search = window.location.search;
const parameters = {};
search.substr(1).split('&').forEach( (entry) => {
  const eq = entry.indexOf('=');
  if (eq >= 0) {
    parameters[decodeURIComponent(entry.slice(0, eq))] =
      decodeURIComponent(entry.slice(eq + 1));
  }
});

// if variables was provided, try to format it.
if (parameters.variables) {
  try {
    parameters.variables =
      JSON.stringify(JSON.parse(parameters.variables), null, 2);
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared
function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

function onEditOperationName(newOperationName) {
  parameters.operationName = newOperationName;
  updateURL();
}

function updateURL() {
  const newSearch = '?' + Object.keys(parameters).filter(  (key) => {
    return Boolean(parameters[key]);
  }).map( (key) => {
    return encodeURIComponent(key) + '=' +
      encodeURIComponent(parameters[key]);
  }).join('&');
  history.replaceState(null, null, newSearch);
}

// Defines a GraphQL fetcher using the fetch API.
const graphQLEndpoint = window.location.protocol + '//' + window.location.host + '/graphql';
function graphQLFetcher(graphQLParams) {
  return fetch(graphQLEndpoint, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(graphQLParams),
    credentials: 'same-origin',
  }).then(r => r.text()).then( (responseBody) => {
    try {
      return JSON.parse(responseBody);
    } catch (error) {
      return responseBody;
    }
  });
}
const subscriptionsEndpoint = graphQLEndpoint.replace(/^http/, 'ws');
const subscriptionsClient =
  new window.SubscriptionsTransportWs.SubscriptionClient(
    subscriptionsEndpoint,
    {
      reconnect: true
    }
  );
const graphQLFetcherWithSubscriptions = 
  window.GraphiQLSubscriptionsFetcher.graphQLFetcher(
    subscriptionsClient,
    graphQLFetcher
  );

// Render <GraphiQL /> into the body.
ReactDOM.render(
  <GraphiQL
    fetcher={graphQLFetcherWithSubscriptions}
    query={parameters.query}
    variables={parameters.variables}
    operationName={parameters.operationName}
    onEditQuery={onEditQuery}
    onEditVariables={onEditVariables}
    onEditOperationName={onEditOperationName}
    docExplorerOpen
  />,
  document.getElementById('graphiql')
);
