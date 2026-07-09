# GraphiQL Explorer Plugin

> **Deprecated.** This package wraps the unmaintained OneGraph `graphiql-explorer` library. As of v6, GraphiQL ships a first-party visual query builder via `@graphiql/plugin-query-builder` (default-installed in `graphiql`). Removal of this package is planned for v7. See the [migration guide](../../docs/migration/graphiql-6.0.0.md).

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
import { createTransport } from '@graphiql/toolkit';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import 'graphiql/style.css';
import '@graphiql/plugin-explorer/style.css';

const transport = createTransport({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

// Pass the explorer props here if you want
const explorer = explorerPlugin();

function GraphiQLWithExplorer() {
  return <GraphiQL transport={transport} plugins={[explorer]} />;
}
```

## CDN bundles

You can also use this plugin via an ESM-based CDN like [esm.sh](https://esm.sh).

See the [CDN example](./example/index.html) for a working demo.
