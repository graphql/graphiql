let defaultOptions = {
  results: '',
  variables: { skip: 3, something: 'else', whoever: 'bobobbbbobb2' },
  query: 'query { allFilms { id title }}',
  url: 'https://swapi.graph.cool',
  containerId: 'graphiql',
};

export default async function renderGraphiql(opts = {}) {
  let options = { ...defaultOptions, ...opts };
  let url = options.url || '';
  let queryString = options.query;
  let variablesString = options.variables
    ? JSON.stringify(options.variables, null, 2)
    : null;
  let resultString = options.result
    ? JSON.stringify(options.result, null, 2)
    : null;

  // Collect the URL parameters
  let parameters = {};
  window.location.search
    .substr(1)
    .split('&')
    .forEach(function(entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(
          entry.slice(eq + 1),
        );
      }
    });

  // Produce a Location query string from a parameter object.
  function locationQuery(params) {
    return (
      '?' +
      Object.keys(params)
        .map(function(key) {
          return (
            encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
          );
        })
        .join('&')
    );
  }

  // Derive a fetch URL from the current URL, sans the GraphQL parameters.
  let graphqlParamNames = {
    query: true,
    variables: true,
    operationName: true,
  };

  let otherParams = {};
  for (let k in parameters) {
    if (parameters.hasOwnProperty(k) && graphqlParamNames[k] === true) {
      otherParams[k] = parameters[k];
    }
  }

  var fetchURL = url + locationQuery(otherParams).toString();

  function graphQLFetcher(graphQLParams) {
    return fetch(fetchURL, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
    }).then(function(response) {
      return response.json().then(function(res) {
        return res;
      });
    });
  }

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
  function updateURL() {
    history.replaceState(null, null, locationQuery(parameters));
  }

  return ReactDOM.render(
    React.createElement(GraphiQL, {
      fetcher: graphQLFetcher,
      onEditQuery: onEditQuery,
      onEditVariables: onEditVariables,
      query: queryString,
      response: resultString,
      variables: variablesString,
    }),
    document.getElementById(options.containerId),
  );
}
