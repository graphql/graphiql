# GraphiQL Code Exporter Plugin

This package provides a plugin that integrates the [`GraphiQL Code Exporter`](https://github.com/OneGraph/graphiql-code-exporter) into the GraphiQL UI.

## Install

Use your favorite package manager to install the package:

```sh
npm i -S @graphiql/plugin-code-exporter
```

The following packages are peer dependencies, so make sure you have them installed as well:

```sh
npm i -S react react-dom graphql
```

## Usage

```jsx
import { useCodeExporterPlugin } from '@graphiql/plugin-code-exporter';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { useState } from 'react';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-code-exporter/dist/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

const snippets = [`your-custom-snippets`];

function GraphiQLWithExplorer() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const exporterPlugin = useCodeExporterPlugin({
    query,
    snippets,
    codeMirrorTheme: 'graphiql',
  });
  return (
    <GraphiQL
      fetcher={fetcher}
      query={query}
      onEditQuery={setQuery}
      plugins={[exporterPlugin]}
    />
  );
}
```

## CDN bundles

You can also use this plugin when using the [CDN bundle](../../examples/graphiql-cdn) to render GraphiQL. Check out the [example HTML file](examples/index.html) that shows how you can do this.
