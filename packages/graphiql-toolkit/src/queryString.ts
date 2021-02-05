/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

export function parseQueryStringURL(searchURL: string) {
  const parameters: any = {};
  searchURL
    .substr(1)
    .split('&')
    .forEach(function (entry) {
      const eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(
          entry.slice(eq + 1),
        );
      }
    });
  return parameters;
}

export function updateQueryStringURL(
  parameters: any,
  parameter: string,
  value: string,
) {
  parameters[parameter] = value;
  let newSearch: string = '';
  if (
    parameters.operationName !== undefined ||
    parameters.operation !== undefined ||
    parameters.variables !== undefined
  ) {
    newSearch =
      '?' +
      Object.keys(parameters)
        .filter(function (key) {
          return Boolean(parameters[key]);
        })
        .map(function (key) {
          return (
            encodeURIComponent(key) +
            '=' +
            encodeURIComponent(parameters?.[key])
          );
        })
        .join('&');
  }
  return newSearch;
}
