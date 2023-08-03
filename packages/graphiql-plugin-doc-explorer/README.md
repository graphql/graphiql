# GraphiQL Doc Explorer Plugin

## Install

Use your favorite package manager to install the package:

```sh
npm i -S @graphiql/plugin-doc-explorer
```

The following packages are peer dependencies, so make sure you have them
installed as well:

```sh
npm i -S react react-dom graphql
```

## Usage

```jsx
import { docExplorerPlugin } from '@graphiql/plugin-doc-explorer';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { useState } from 'react';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-explorer/dist/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

// pass the explorer props here if you want
const docExplorer = docExplorerPlugin();

return (
  <GraphiQL
    fetcher={fetcher}
    query={query}
    onEditQuery={setQuery}
    plugins={[docExplorer]}
    // this is required if you want doc explorer plugin to be the
    // plugin opened when clicking references in hint/completion context
    referencePlugin={docExplorer}
  />
);
```

## CDN bundles

You can also use add this plugin when using the
[CDN bundle](../../examples/graphiql-cdn) to render GraphiQL. Check out the
[example HTML file](examples/index.html) that shows how you can do this.
