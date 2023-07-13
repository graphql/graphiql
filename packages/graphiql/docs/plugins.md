# Creating GraphiQL Plugins!

> coming soon: `create-graphiql-plugin`! check back for

Developing GraphiQL plugins has always been possible since we introduced them in `graphiql@2`, but the configuration has been a bit tricky
For this, we've created [`@graphiql/plugin-utils`](../../graphiql-plugin-utils/) to help minimize the configuration footprint, set some conventions, and get you up and running

## Getting Started

1. copy `packages/graphiql-plugin-explorer` to get started
1. customize the package `name`, `description`, and `dependencies`, etc as needed
1. in `vite.config.ts`, change the `umdExportName`. this is how users will load your plugin in the commonly used UMD mode (aka cdn mode, see below)
1. now, begin authoring your plugin in `src/index.tsx`

## Use the `@graphiql/react` SDK

you can use the `@graphiql/react` hooks as needed, as your plugin will be able to access all needed contexts

```ts
import {
  useEditorContext,
  useSchemaContext,
  useExecutionContext,
} from '@graphiql/react';

const { setOperationName } = useEditorContext({ nonNull: true });
const { schema } = useSchemaContext({ nonNull: true });
const { run } = useExecutionContext({ nonNull: true });
```

## Export a plugin definition

now, your default export can be the entire plugin definition:

```tsx
import { printSchema } from 'graphql';
import { useSchemaContext } from '@graphiql/react';
import { PrintIconSvg } from './icons';

import type { GraphiQLPlugin } from '@graphiql/react';

function SchemaPrinter() {
  const { schema } = useSchemaContext({ nonNull: true });
  return <div>{printSchema(schema)}</div>;
}

const SchemaPrinterPlugin = {
  name: 'Schema Printer Plugin',
  content: () => <SchemaPrinter />,
  icon: () => <PrintIconSvg />,
};
export { SchemaPrinterPlugin };
```

## Usage: ESM

Now that it's published to npm or in your monorepo, you can use the plugin in ESM bundler mode easily

```tsx
import { GraphiQL } from 'graphiql';
import MyPlugin from 'my-schema-printer-plugin';

<GraphiQL plugins={[MyPlugin]} />;
```

## Usage: CDN (umd)

This is where you would use the `umdExportName`.

In this case, we specified `MySchemaPrinterPlugin`:

```ts
import { defineConfig } from 'vite';
import { graphiqlVitePlugin } from '@graphiql/plugin-utils';

export default defineConfig({
  plugins: graphiqlVitePlugin({ umdExportName: 'MySchemaPrinterPlugin' }),
});
```

So we use that UMD global in our script:

```html
<html lang="en">
  <head>
    <title>My Schema Printer Plugin Example</title>
  </head>
  <body>
    <div id="graphiql"></div>
  </body>
  <!-- be sure to include all the other imports, such as react, react-dom and graphiql itself, see /examples/graphiql-cdn -->
  <script
    src="https://unpkg.com/my-schema-printer-plugin@0.1.12/dist/my-schema-printer-plugin.umd.js"
    crossorigin="anonymous"
  ></script>

  <script>
    const fetcher = GraphiQL.createFetcher({
      url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
    });

    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    root.render(
      React.createElement(GraphiQL, {
        fetcher,
        plugins: [MySchemaPrinterPlugin],
      }),
    );
  </script>
</html>
```
