GraphiQL - With Custom Headers
========

Checkout the GraphiQL documentation on https://github.com/graphql/graphiql



To allow **Custom Headers** feature your `graphQLFetcher` might take an extra argument
and supply it instead of headers:

```js
function graphQLFetcher(graphQLParams, myCustomHeaders) {
  return fetch(window.location.origin + '/graphql', {
    method: 'post',
    headers: myCustomHeaders,
    body: JSON.stringify(graphQLParams),
  }).then(response => response.json());
}
```


Copyright (c) 2015, Facebook, Inc. All rights reserved.
