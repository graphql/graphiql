# GraphiQL Batch Request Plugin

This package provides a plugin that allows sending a batch request to a GraphQL Server and thence into the GraphiQI UI.

## Install

Use your favoriton package manager to install the package:

```sh
npm i -S @graphiql/plugin-batch-request
```

The following packages are peer dependencies, so make sure you have them installed as well:

```sh
npm i -S react react-dom graphql
```

## Usage

The plugin scope is for sending multiple GraphQL operations as an array, so the GraphQL server must be configured to allow arrays.

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

Sending a batch request to spacex GraphQL server: 

https://user-images.githubusercontent.com/6611331/212411159-336abe77-5f0a-4453-9de3-62abe039168f.mov