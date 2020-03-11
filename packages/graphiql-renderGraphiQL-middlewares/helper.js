// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
export function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

export function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

export function updateURL() {
  history.replaceState(null, null, locationQuery(parameters));
}

// Produce a Location query string from a parameter object.
export function locationQuery(params) {
  return (
    '?' +
    Object.keys(params)
      .map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      })
      .join('&')
  );
}

export function queryParameters() {
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

  return parameters;
}

// Derive a fetch URL from the current URL, sans the GraphQL parameters.
let graphqlParamNames = {
  query: true,
  variables: true,
  operationName: true,
};

export function otherParameters(parameters = {}) {
  let otherParams = {};
  for (let k in parameters) {
    if (parameters.hasOwnProperty(k) && graphqlParamNames[k] === true) {
      otherParams[k] = parameters[k];
    }
  }
  return otherParams;
}
