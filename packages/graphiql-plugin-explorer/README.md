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
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-explorer/dist/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

// pass the explorer props here if you want
const explorer = explorerPlugin();

return <GraphiQL fetcher={fetcher} plugins={[explorer]} />;
```

## CDN bundles

You can also use this plugin with `unpkg`, `jsdelivr`, and other CDNs.

See the [example HTML file](examples/index.html) for this plugin
