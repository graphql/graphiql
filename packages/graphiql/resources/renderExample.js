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

// Parse the search string to get url parameters.
var search = window.location.search;
var parameters = {};
search
  .substr(1)
  .split('&')
  .forEach(function (entry) {
    var eq = entry.indexOf('=');
    if (eq >= 0) {
      parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(
        entry.slice(eq + 1),
      );
    }
  });

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

function onEditHeaders(newHeaders) {
  parameters.headers = newHeaders;
  updateURL();
}

function onTabChange(tabsState) {
  const activeTab = tabsState.tabs[tabsState.activeTabIndex];
  parameters.query = activeTab.query;
  parameters.variables = activeTab.variables;
  parameters.headers = activeTab.headers;
  updateURL();
}

function updateURL() {
  var newSearch =
    '?' +
    Object.keys(parameters)
      .filter(function (key) {
        return Boolean(parameters[key]);
      })
      .map(function (key) {
        return (
          encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key])
        );
      })
      .join('&');
  history.replaceState(null, null, newSearch);
}

function getSchemaUrl() {
  const isDev = window.location.hostname.match(/localhost$/);

  if (isDev) {
    // This supports an e2e test which ensures that invalid schemas do not load.
    if (parameters.bad === 'true') {
      return '/bad/graphql';
    } else if (parameters['http-error'] === 'true') {
      return '/http-error/graphql';
    } else if (parameters['graphql-error'] === 'true') {
      return '/graphql-error/graphql';
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
    inputValueDeprecation: GraphQLVersion.includes('15.5') ? undefined : true,
    onTabChange,
  }),
  document.getElementById('graphiql'),
);
