# GraphiQL Batch Request Plugin

This package provides a plugin that allows sending a batch request to a GraphQL Server and thence into the GraphiQI UI.

The plugin scope is for sending multiple GraphQL using 2 main batching strategy:
1. Single operation.
2. Array of operations (GraphQL server must be configured to allow arrays).

### Single operation
Combine multiple operations ad execute them as one.

For example, given the following GraphQL operations:

```graphql
query Query1($arg: String) {
  field1
  field2(input: $arg)
}

query Query2($arg: String) {
  field2(input: $arg)
  alias: field3
}
```

These can be merged into one operation:

```graphql
query ($_0_arg: String, $_1_arg: String) {
  _0_field1: field1
  _0_field2: field2(input: $_0_arg)
  _1_field2: field3(input: $_1_arg)
  _1_alias: field3
}
```

### Array of operations
Combine multiple GraphQL Requests and combine them into one GraphQL Request using an array, having the server recognize the request as an array of operations instead of a single one, and handle each operation separately.

For example, given the following GraphQL Requests:

```json
{
  "operationName": "Query1",
  "query": "query Query1($arg: String) { ... }",
  "variables": { 
    "arg": "foo"
  }
}

{
  "operationName": "Query2",
  "query": "query Query2($arg: String) { ... }",
  "variables": { 
    "arg": "foo"
  }
}

```

These can be merged into one GraphQL Array Request:

```json
[
  {
    "operationName": "Query1",
    "query": "query Query1($arg: String) { ... }",
    "variables": { 
      "arg": "foo"
    }
  },
  {
    "operationName": "Query2",
    "query": "query Query2($arg: String) { ... }",
    "variables": { 
      "arg": "foo"
    }
  }
]
```

## Install

Use your favorite package manager to install the package:

```sh
npm i -S @graphiql/plugin-batch-request
```

The following packages are peer dependencies, so make sure you have them installed as well:

```sh
npm i -S react react-dom graphql
```

## Usage

```jsx
import { useBatchRequestPlugin } from '@graphiql/plugin-batch-request';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { useState } from 'react';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-batch-request/dist/style.css';

const url = 'https://countries.trevorblades.com/graphql';

const fetcher = createGraphiQLFetcher({
  url
});

function GraphiQLWithExplorer() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const batchRequestPlugin = useBatchRequestPlugin({ url });
  return (
    <GraphiQL
      fetcher={fetcher}
      query={query}
      onEditQuery={setQuery}
      plugins={[batchRequestPlugin]}
    />
  );
}
```


### Example 

Sending a batch request to the countries GraphQL server: 

https://user-images.githubusercontent.com/6611331/216736177-2d8d6153-b246-48ef-8e97-687beea6f9fc.mov