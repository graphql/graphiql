# GraphiQL Explorer Plugin

This package provides a plugin that integrates the
[`GraphiQL Explorer`](https://github.com/OneGraph/graphiql-explorer) into the GraphiQL UI.

## Installation

Use your preferred package manager to install the plugin:

```sh
npm install @graphiql/plugin-explorer
```

Make sure to also install the required peer dependencies:

```sh
npm install react react-dom graphql
```

## Usage

```jsx
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import 'graphiql/style.css';
import '@graphiql/plugin-explorer/dist/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

// Pass the explorer props here if you want
const explorer = explorerPlugin();

function GraphiQLWithExplorer() {
  return <GraphiQL fetcher={fetcher} plugins={[explorer]} />;
}
```

## CDN bundles

You can also use this plugin via an ESM-based CDN like [esm.sh](https://esm.sh).

See the [CDN example](./example/index.html) for a working demo.
