# GraphiQL Code Exporter Plugin

This package provides a plugin that integrates the
[GraphiQL Code Exporter](https://github.com/OneGraph/graphiql-code-exporter)
into the GraphiQL UI.

## Install

Use your favorite package manager to install the package:

```sh
npm i -S @graphiql/plugin-code-exporter
```

The following packages are peer dependencies, so make sure you have them
installed as well:

```sh
npm i -S react react-dom graphql
```

## Usage

See
[GraphiQL Code Exporter README](https://github.com/OneGraph/graphiql-code-exporter)
for all details on available `props` and how to
[create snippets](https://github.com/OneGraph/graphiql-code-exporter#snippets).

```jsx
import { useExporterPlugin } from '@graphiql/plugin-code-exporter';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { useState } from 'react';

import 'graphiql/graphiql.css';
import '@graphiql/plugin-code-exporter/dist/style.css';

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
});

/*
Example code for snippets. See https://github.com/OneGraph/graphiql-code-exporter#snippets for details
*/

const removeQueryName = query =>
  query.replace(
    /^[^{(]+([{(])/,
    (_match, openingCurlyBracketsOrParenthesis) =>
      `query ${openingCurlyBracketsOrParenthesis}`,
  );

const getQuery = (arg, spaceCount) => {
  const { operationDataList } = arg;
  const { query } = operationDataList[0];
  const anonymousQuery = removeQueryName(query);
  return (
    ` `.repeat(spaceCount) +
    anonymousQuery.replace(/\n/g, `\n` + ` `.repeat(spaceCount))
  );
};

const exampleSnippetOne = {
  name: `Example One`,
  language: `JavaScript`,
  codeMirrorMode: `jsx`,
  options: [],
  generate: arg => `export const query = graphql\`
${getQuery(arg, 2)}
\`
`,
};

const exampleSnippetTwo = {
  name: `Example Two`,
  language: `JavaScript`,
  codeMirrorMode: `jsx`,
  options: [],
  generate: arg => `import { graphql } from 'graphql'

export const query = graphql\`
${getQuery(arg, 2)}
\`
`,
};

const snippets = [exampleSnippetOne, exampleSnippetTwo];

function GraphiQLWithExplorer() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const exporterPlugin = useExporterPlugin({
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

You can also use this plugin when using the
[CDN bundle](../../examples/graphiql-cdn) to render GraphiQL. Check out the
[example HTML file](examples/index.html) that shows how you can do this.
