# `@graphiql/cdn`

A pre-bundled CDN distribution of [GraphiQL](https://github.com/graphql/graphiql). Load GraphiQL in a browser from a static CDN with no build step, no importmap, and no third-party bundler in the request path.

The package ships a single ESM file (`dist/graphiql.js`) with the GraphiQL UI, the default plugins, and all dependencies inlined. `react` and `react-dom` stay external and must be supplied by the page.

## Usage

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>GraphiQL</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@graphiql/cdn@<version>/dist/style.css"
    />
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19",
          "react-dom": "https://esm.sh/react-dom@19"
        }
      }
    </script>
    <style>
      body {
        margin: 0;
      }
      #graphiql {
        height: 100dvh;
      }
    </style>
  </head>
  <body>
    <div id="graphiql"></div>
    <script type="module">
      import { createRoot } from 'react-dom/client';
      import {
        GraphiQL,
        HISTORY_PLUGIN,
        createGraphiQLFetcher,
        explorerPlugin,
      } from 'https://cdn.jsdelivr.net/npm/@graphiql/cdn@<version>/dist/graphiql.js';

      const fetcher = createGraphiQLFetcher({
        url: 'https://countries.trevorblades.com',
      });

      createRoot(document.getElementById('graphiql')).render(
        <GraphiQL
          fetcher={fetcher}
          plugins={[HISTORY_PLUGIN, explorerPlugin()]}
        />,
      );
    </script>
  </body>
</html>
```

Pin a specific `<version>` for production use.

## What is exported

- `GraphiQL` — the main component (also the default export)
- `HISTORY_PLUGIN` — the history plugin instance
- `explorerPlugin` — the schema explorer plugin factory
- `createGraphiQLFetcher` — convenience fetcher for `GraphiQL`'s `fetcher` prop
- `createLocalStorage` — convenience storage factory for multi-instance pages
- `GraphiQLReact` — the full `@graphiql/react` namespace, for advanced customization
- `GraphQL` — the full `graphql-js` namespace, so plugins can reuse the same instance

## When not to use this package

If you have a build step (Vite, webpack, Next.js, etc.), install `graphiql` and the plugins you want from npm directly. This package exists for the no-build-step CDN use case.
