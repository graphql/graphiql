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
