GraphiQL
========

*/ˈɡrafək(ə)l/* An interactive in-browser GraphQL IDE. [Try the live demo](http://graphql-swapi.parseapp.com/graphiql/).

[![Build Status](https://travis-ci.org/graphql/graphiql.svg)](https://travis-ci.org/graphql/graphiql)

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


### Usage

GraphiQL exports a single React component which is intended to encompass the
entire browser viewport. This React component renders the GraphiQL editor.

```js
import GraphiQL from 'graphiql';

<GraphiQL />
```

GraphiQL supports customization in UI and behavior by accepting React props
and children.

**Props:**

- `fetcher`: a required function which accepts GraphQL-HTTP parameters and
  returns a Promise which resolves to the GraphQL parsed JSON response.

- `schema`: an optional GraphQLSchema instance. If one is not provided,
  GraphiQL will fetch one using introspection.

- `query`: an optional GraphQL string to use as the initial displayed query,
  if not provided, the local storage or defaultQuery will be used.

- `response`: an optional JSON string to use as the initial displayed
  response. If not provided, no response will be initialy shown. You might
  provide this if illustrating the result of the initial query.

- `storage`: an instance of [Storage][] GraphiQL will use to persist state.
  Only `getItem` and `setItem` are called. Default: window.localStorage

- `defaultQuery`: an optional GraphQL string to use instead of a
  blank screen when a query was not found in the local cache.

- `variables`: an optional GraphQL string to use as the initial displayed
  query variables, if not provided, the local storage will be used.

- `onEditQuery`: an optional function which will be called when the Query
  editor changes. The argument to the function will be the query string.

- `onEditVariables`: an optional function which will be called when the Query
  varible editor changes. The argument to the function will be the
  variables string.

- `getDefaultFieldNames`: an optional function used to provide default fields
  to non-leaf fields which invalidly lack a selection set.
  Accepts a GraphQLType instance and returns an array of field names.
  If not provided, a default behavior will be used.

**Children:**

* `<GraphiQL.Logo>`: Replace the GraphiQL logo with your own.

* `<GraphiQL.Toolbar>`: Add a custom toolbar above GraphiQL.

* `<GraphiQL.Footer>`: Add a custom footer below GraphiQL Results.
