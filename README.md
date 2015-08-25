GraphiQL
========

*/ˈɡrafək(ə)l/* An interactive in-browser GraphQL IDE. [Try the live demo](http://graphql-swapi.parseapp.com/graphiql/).

![](resources/graphiql.png)

### Getting started

```
npm install --save graphiql
```

GraphiQL provides a React component responsible for rendering the UI, which
should be provided with a function for fetching from GraphQL, we recommend using
the [fetch](https://fetch.spec.whatwg.org/) standard API.

```js
import React from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';

function graphQLFetcher(graphQLParams) {
  return fetch(window.location.origin + '/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphQLParams),
  }).then(response => response.json());
}

React.render(<GraphiQL fetcher={graphQLFetcher} />, document.body);
```

Build for the web with [webpack](http://webpack.github.io/) or
[browserify](http://browserify.org/), or use the pre-bundled graphiql.js file.
See the example in the git repository to see how to use the pre-bundled file.


### Features

* Syntax highlighting
* Intelligent type ahead of fields, arguments, types, and more.
* Real-time error highlighting and reporting.
* Automatic query completion.
* Run and inspect query results
