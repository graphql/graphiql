# GraphiQL Explorer Plugin

This package provides a plugin that integrated the
[`GraphiQL Explorer`](https://github.com/OneGraph/graphiql-explorer) into the
GraphiQL UI.

## Install

Use your favorite package manager to install the package:

```sh
npm install @graphiql/plugin-explorer
```

The following packages are peer dependencies, so make sure you have them
installed as well:

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

You can also use this plugin with `unpkg`, `jsdelivr`, and other CDNs.

See the [example HTML file](examples/index.html) for this plugin
