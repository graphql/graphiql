# GraphiQL Explorer Plugin

This package provides a plugin that integrated the
[`GraphiQL Explorer`](https://github.com/OneGraph/graphiql-explorer) into the
GraphiQL UI.

## Install

Use your favorite package manager to install the package:

```sh
npm i -S @graphiql/plugin-explorer
```

The following packages are peer dependencies, so make sure you have them
installed as well:

```sh
npm i -S react react-dom graphql
```

## Usage

```jsx
import { useExplorerPlugin } from '@graphiql/plugin-explorer';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { useState } from 'react';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-explorer/dist/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

function GraphiQLWithExplorer() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });
  return (
    <GraphiQL
      fetcher={fetcher}
      query={query}
      onEditQuery={setQuery}
      plugins={[explorerPlugin]}
    />
  );
}
```

## CDN bundles

You can also use add this plugin when using the
[CDN bundle](../../examples/graphiql-cdn) to render GraphiQL. Check out the
[example HTML file](examples/index.html) that shows how you can do this.
