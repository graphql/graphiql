/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

export function updateQueryStringURL(parameters: any) {
  if (
    parameters.operationName !== undefined ||
    parameters.operation !== undefined ||
    parameters.variables !== undefined
  ) {
    const newSearch =
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
    history.replaceState(null, document.title, newSearch);
  }
}
