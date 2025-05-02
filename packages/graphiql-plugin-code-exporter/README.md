# GraphiQL Code Exporter Plugin

This package provides a plugin that integrates the
[GraphiQL Code Exporter](https://github.com/OneGraph/graphiql-code-exporter) into the GraphiQL UI.

## Installation

Install the plugin using your preferred package manager:

```sh
npm install @graphiql/plugin-code-exporter
```

Make sure to also install the required peer dependencies:

```sh
npm install react react-dom graphql
```

## Usage

Refer to the
[GraphiQL Code Exporter README](https://github.com/OneGraph/graphiql-code-exporter) for full details on available `props` and how to [create snippets](https://github.com/OneGraph/graphiql-code-exporter#snippets).

Example integration:

```jsx
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';
import 'graphiql/style.css';
import '@graphiql/plugin-code-exporter/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://countries.trevorblades.com',
});
function getQuery(arg, spaceCount = 2) {
  const spaces = ' '.repeat(spaceCount);
  const { query } = arg.operationDataList[0];
  return spaces + query.replaceAll('\n', '\n' + spaces);
}

const codeExporter = codeExporterPlugin({
  /**
   * Example code for snippets. See https://github.com/OneGraph/graphiql-code-exporter#snippets for details.
   */
  snippets: [
    {
      name: 'Example One',
      language: 'JavaScript',
      codeMirrorMode: 'jsx',
      options: [],
      generate: arg =>
        ['export const query = graphql`', getQuery(arg), '`'].join('\n'),
    },
    {
      name: 'Example Two',
      language: 'JavaScript',
      codeMirrorMode: 'jsx',
      options: [],
      generate: arg =>
        [
          "import { graphql } from 'graphql'",
          '',
          'export const query = graphql`',
          getQuery(arg),
          '`',
        ].join('\n'),
    },
  ],
});
function App() {
  return <GraphiQL fetcher={fetcher} plugins={[codeExporter]} />;
}
```

## CDN bundles

You can also use this plugin via an ESM-based CDN like [esm.sh](https://esm.sh).

See the [CDN example](./example/index.html) for a working demo.
