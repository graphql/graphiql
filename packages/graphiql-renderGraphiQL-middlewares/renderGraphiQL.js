import ReactDOM from 'react-dom';
import React from 'react';
import GraphiQL from 'graphiql';
import {
  onEditQuery,
  onEditVariables,
  locationQuery,
  queryParameters,
  otherParameters,
} from './helper';

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
  let parameters = queryParameters();
  let otherParams = otherParameters(parameters);
  let fetchURL = url + locationQuery(otherParams).toString();

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

  return ReactDOM.render(
    <GraphiQL
      fetcher={graphQLFetcher}
      onEditQuery={onEditQuery}
      onEditVariables={onEditVariables}
      query={queryString}
      response={resultString}
      variables={variablesString}
    />,
    document.getElementById(options.containerId),
  );
}
