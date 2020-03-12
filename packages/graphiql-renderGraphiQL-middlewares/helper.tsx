export const defaultOptions = {
  results: '',
  variables: { skip: 3, something: 'else', whoever: 'bobobbbbobb2' },
  query: 'query { allFilms { id title }}',
  url: 'https://swapi.graph.cool',
  containerId: 'graphiql',
};

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared.
export function onEditQuery(newQuery): void {
  parameters.query = newQuery;
  updateURL();
}

export function onEditVariables(newVariables: string): void {
  parameters.variables = newVariables;
  updateURL();
}

export function updateURL(): void {
  history.replaceState(null, null, locationQuery(parameters));
}

// Produce a Location query string from a parameter object.
export function locationQuery(params: any): string {
  return (
    '?' +
    Object.keys(params)
      .map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      })
      .join('&')
  );
}

export function queryParameters(): object {
  const parameters = {};
  window.location.search
    .substr(1)
    .split('&')
    .forEach(function(entry) {
      const eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(
          entry.slice(eq + 1),
        );
      }
    });

  return parameters;
}

// Derive a fetch URL from the current URL, sans the GraphQL parameters.
const graphqlParamNames = {
  query: true,
  variables: true,
  operationName: true,
};

export function otherParameters(parameters = {}): object {
  const otherParams = {};
  for (const k in parameters) {
    if (parameters.hasOwnProperty(k) && graphqlParamNames[k] === true) {
      otherParams[k] = parameters[k];
    }
  }
  return otherParams;
}

export const getFetcher = async opts => {
  // only load isomorphic fetch if a fetcher is not provided
  const { default: fetch } = await import('isomorphic-fetch');
  if (!opts.containerEl || opts.containerId) {
    logger.warn(
      'no containerEl or containerId provided, defaulting to #graphiql',
    );
  }
  if (!opts.url || !opts.fetcher) {
    logger.warn(
      'no url or custom fetcher provided, defaulting to POSTs against https://swapi.graph.cool',
    );
  }
  const resultFn = async graphQLParams => {
    const result = await fetch(opts.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers,
      },
      body: JSON.stringify(graphQLParams),
    });
    return result.json();
  };
  return resultFn;
};
