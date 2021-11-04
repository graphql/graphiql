# GraphiQL

> **Security Notice:** All versions of `graphiql` < `1.4.3` are vulnerable to an XSS attack in cases where the GraphQL server to which the GraphiQL web app connects is not trusted. Learn more in [our security advisory](https://github.com/graphql/graphiql/tree/main/docs/security/2021-introspection-schema-xss.md).

> **Breaking Changes & Improvements:** several interfaces are being dropped for new ones for GraphiQL 2.0.0! Read more in [this issue](https://github.com/graphql/graphiql/issues/1165)

> **[`graphiql@2.0.0-beta`](https://github.com/graphql/graphiql/issues/983)** is a much larger ongoing effort that introduces plugins, i18n, and so many more features after a substantial rewrite using modern react.

[![NPM](https://img.shields.io/npm/v/graphiql.svg)](https://npmjs.com/graphiql)
![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/graphiql)
![npm downloads](https://img.shields.io/npm/dm/graphiql?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/graphiql)
![npm bundle size (version)](https://img.shields.io/bundlephobia/min/graphiql/latest)
![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/graphiql/latest)
[![License](https://img.shields.io/npm/l/graphiql.svg?style=flat-square)](LICENSE)
[Discord Channel](https://discord.gg/NP5vbPeUFp)
_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql).

[![](https://raw.githubusercontent.com/graphql/graphiql/master/packages/graphiql/resources/graphiql.jpg)](http://graphql.org/swapi-graphql)

## Features

- Syntax highlighting.
- Intelligent type ahead of fields, arguments, types, and more.
- Real-time error highlighting and reporting for queries and variables.
- Automatic query and variables completion.
- Automatically adds required fields to queries.
- Documentation explorer, search, with markdown support.
- Query History using local storage
- Run and inspect query results using _any_ promise that resolves JSON results. HTTPS or WSS not required.
- Supports full [GraphQL Language Specification](https://github.com/graphql/graphql-wg):
  - Queries, Mutations, Subscriptions, Fragments, Unions, directives, multiple operations per query, etc

## Live Demos

We have a few demos of `master` branch via the default netlify build (the same URL paths apply to deploy previews on PRs):

1. [`graphiql.min.js` demo](https://graphiql-test.netlify.com/) - the min.js bundle for the current ref
2. [`graphiql.js` demo](https://graphiql-test.netlify.com/dev) - development build is nice for react inspector, debugging, etc
3. [bundle analyzer for graphiql.min.js](https://graphiql-test.netlify.com/analyzer)

## Examples

- [`Unpkg (CDN)`](../../examples/graphiql-cdn/) - a single html file using cdn assets and a script tag
- [`Webpack`](../../examples/graphiql-webpack/) - a starter for webpack
- [`Create React App`](../../examples/graphiql-create-react-app) - an example using [Create React App](https://create-react-app.dev/)
- [`Parcel`](../../examples/graphiql-parcel) - an example using [Parcel](https://parceljs.org/)
- `Rollup` - TODO

## Getting started

### Modules

You can use the `graphiql` module, however bear in mind that `react` `react-dom` and `graphql` will all need to be present already for it to work, as they are `peerDependencies`

With `npm`:

```
npm install --save graphiql react react-dom graphql
```

Alternatively, if you are using [`yarn`](https://yarnpkg.com/):

```
yarn add graphiql react react-dom graphql
```

### UMD

With `unpkg`/`jsdelivr`, etc:

```html
<link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
<script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
```

(see: Usage UMD Bundle below for more required script tags)

## Usage

Build for the web with [webpack](https://webpack.js.org/) or [browserify](http://browserify.org/), or use the pre-bundled `graphiql.js` file. See the [cdn example](../examples/graphiql-cdn/) in the git repository to see how to use the pre-bundled file, or see the [webpack example](../examples/graphiql-webpack) to see how to bundle an application using the `GraphiQL` component.

### Usage: NPM module

**Note**: If you are having webpack issues or questions about webpack, make sure you've cross-referenced your webpack configuration with our own [webpack example](../examples/graphiql-webpack) first. We now have tests in CI that ensure this always builds, and we ensure it works end-to-end with every publish.

Using another GraphQL service? Here's how to get GraphiQL set up:

GraphiQL provides a React component responsible for rendering the UI, which should be provided with a required `fetcher function for executing GraphQL operations against your schema.

For HTTP transport implementations, we recommend using the [fetch](https://fetch.spec.whatwg.org/) standard API, but you can use anything that matches [the type signature](https://graphiql-test.netlify.app/typedoc/modules/graphiql-toolkit.html#fetcher), including async iterables and observables.

You can also install `@graphiql/create-fetcher` to make it easier to create a simple fetcher for conventional http and websockets transports. It uses `graphql-ws@4.x` protocol by default.

```js
import React from 'react';
import ReactDOM from 'react-dom';

import GraphiQL from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const fetcher = createGraphiQLFetcher({
  url: window.location.origin + '/graphql',
});

ReactDOM.render(
  <GraphiQL fetcher={fetcher} editorTheme={'dracula'} />,
  document.body,
);
```

[Read more about using `createGraphiQLFetcher` in the readme](https://github.com/graphql/graphiql/tree/main/packages/graphiql-toolkit/docs/create-fetcher.md) to learn how to add headers, support the legacy `subsriptions-transport-ws` protocol, and more.

### Usage: UMD Bundle over CDN (Unpkg, JSDelivr, etc)

Don't forget to include the CSS file on the page! If you're using `npm` or `yarn`, you can find it in `node_modules/graphiql/graphiql.css`, or you can download it from the [releases page](https://github.com/graphql/graphiql/releases).

For an example of setting up a GraphiQL, check out the [example](../../examples/graphiql-cdn/) in this repository which also includes a few useful features highlighting GraphiQL's API.

The most minimal way to set up GraphiQL is a single index.html file:

```html
<html>
  <head>
    <title>Simple GraphiQL Example</title>
    <link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
  </head>
  <body style="margin: 0;">
    <div id="graphiql" style="height: 100vh;"></div>

    <script
      crossorigin
      src="https://unpkg.com/react/umd/react.production.min.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/graphiql/graphiql.min.js"
    ></script>

    <script>
      const fetcher = GraphiQL.createFetcher({ url: 'https://my/graphql' });

      ReactDOM.render(
        React.createElement(GraphiQL, { fetcher: fetcher }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
```

**Notes**:

- the inlined styles are important for ensuring GraphiQL is visible and fills the canvas.
- using `React.createElement` directly is belaborous, so follow the webpack instructions above for more highly customized implementation
- we can use [`GraphiQL.createFetcher`](https://github.com/graphql/graphiql/tree/main/packages/graphiql-toolkit/docs/create-fetcher.md) in the UMD bundle only, so that it can be tree shaken out for modules

### GraphiQL for my GraphQL Service/HTTP Server/Etc

You may be using a runtime that already provides graphiql, or that provides it via a middleware. For example, we support [`express-graphql`](https://github.com/graphql/express-graphql)!

I would suggest a search for "graphiql <my runtime>" such as "graphiql express", "graphiql absinthe", etc to learn a potentially simpler route to setup for your environment. There are many npm packages, ruby gems, java utilities for deploying graphiql.

Here are some example searches:

- https://www.npmjs.com/search?q=graphiql - ~117 hits
- https://pypi.org/search/?q=graphiql - ~33 hits
- https://search.maven.org/search?q=graphiql - ~15 hits
- https://rubygems.org/search?utf8=%E2%9C%93&query=graphiql - ~6 hits
- https://godoc.org/?q=graphiql - ~12 hits
- https://packagist.org/?query=%22graphiql%22 - ~5 hits
- https://crates.io/search?q=graphiql - ~2 hits

This doesn't include runtimes or libraries where GraphiQL is used but isn't referenced in the package registry search entry.

## Customize

GraphiQL supports customization in UI and behavior by accepting React props and children.

<span id="props"> </span>

### Props

`fetcher` is the only required prop for `<GraphiQL />`.

For more details on props, see the [API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphiql.html#graphiqlprops)

| Prop                             | Type                                                                                                  | Description                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetcher`                        | [`Fetcher function`](https://graphiql-test.netlify.app/typedoc/modules/graphiql-toolkit.html#fetcher) | **Required.** a function which accepts GraphQL-HTTP parameters and returns a Promise, Observable or AsyncIterable which resolves to the GraphQL parsed JSON response.                           |  |
| `schema`                         | [`GraphQLSchema`](https://graphql.org/graphql-js/type/#graphqlschema)                                 | a GraphQLSchema instance or `null` if one is not to be used. If `undefined` is provided, GraphiQL will send an introspection query using the fetcher to produce a schema.                       |
| `query`                          | `string` (GraphQL)                                                                                    | initial displayed query, if `undefined` is provided, the stored query or `defaultQuery` will be used. You can also set this value at runtime to override the current operation editor state.    |
| `validationRules`                | `ValidationRule[]`                                                                                    | A array of validation rules that will be used for validating the GraphQL operations. If `undefined` is provided, the default rules (exported as `specifiedRules` from `graphql`) will be used.  |
| `variables`                      | `string` (JSON)                                                                                       | initial displayed query variables, if `undefined` is provided, the stored variables will be used.                                                                                               |
| `headers`                        | `string`                                                                                              | initial displayed request headers. if not defined, it will default to the stored headers if `shouldPersistHeaders` is enabled.                                                                  |
| `externalFragments`              | `string \| FragmentDefinitionNode[]`                                                                  | provide fragments external to the operation for completion, validation, and for selective use when executing operations.                                                                        |
| `operationName`                  | `string`                                                                                              | an optional name of which GraphQL operation should be executed.                                                                                                                                 |
| `response`                       | `string` (JSON)                                                                                       | an optional JSON string to use as the initial displayed response. If not provided, no response will be initially shown. You might provide this if illustrating the result of the initial query. |
| `storage`                        | [`Storage`](https://graphiql-test.netlify.app/typedoc/interfaces/graphiql.storage.html)               | **Default:** `window.localStorage`. an interface that matches `window.localStorage` signature that GraphiQL will use to persist state.                                                          |
| `defaultQuery`                   | `string`                                                                                              | **Default:** graphiql help text. Provides default query if no user state is present.                                                                                                            | default graphiql help text |
| `defaultVariableEditorOpen`      | `boolean`                                                                                             | sets whether or not to show the variables pane on startup. overridden by user state (**deprecated** in favor of `defaultSecondaryEditorOpen`)                                                   |
| `defaultSecondaryEditorOpen`     | `boolean`                                                                                             | sets whether or not to show the variables/headers pane on startup. If not defined, it will be based off whether or not variables and/or headers are present.                                    |
| `getDefaultFieldNames`           | `Function`                                                                                            | **Default:** `defaultGetDefaultFieldNames`. provides default field values for incomplete queries                                                                                                | `defaultGetDefaultFieldNames` |
| `editorTheme`                    | `string`                                                                                              | **Default:** `graphiql`. names a CodeMirror theme to be applied to the `QueryEditor`, `ResultViewer`, and `Variables` panes. See below for full usage.                                          |
| `readOnly`                       | `boolean`                                                                                             | when `true` will make the `QueryEditor` and `Variables` panes readOnly.                                                                                                                         |
| `dangerouslyAssumeSchemaIsValid` | `boolean`                                                                                             | **Default:** `false`. When true, don't check that the loaded schema is valid; this can make the app vulnerable to XSS attacks and is not recommended.                                           |
| `docExplorerOpen`                | `boolean`                                                                                             | when `true` will ensure the `DocExplorer` is open by default when the user first renders the component. Overridden by user's toggle state                                                       |
| `headerEditorEnabled`            | `boolean`                                                                                             | **Default:** `false`. enables the header editor when `true`.                                                                                                                                    |
| `shouldPersistHeaders`           | `boolean`                                                                                             | **Default:** `false`. o persist headers to storage when `true`                                                                                                                                  |
| `toolbar.additionalContent`      | `React.Component[]`                                                                                   | pass additional toolbar react components inside a fragment                                                                                                                                      | `null` |
| `onEditQuery`                    | `Function`                                                                                            | called when the Query editor changes. The argument to the function will be the query string.                                                                                                    |
| `onEditVariables`                | `Function`                                                                                            | called when the Query variable editor changes. The argument to the function will be the variables string.                                                                                       |
| `onEditHeaders`                  | `Function`                                                                                            | called when the request headers editor changes. The argument to the function will be the headers string.                                                                                        |
| `onEditOperationName`            | `Function`                                                                                            | called when the operation name to be executed changes.                                                                                                                                          |
| `onToggleDocs`                   | `Function`                                                                                            | called when the docs will be toggled. The argument to the function will be a boolean whether the docs are now open or closed.                                                                   |
| `maxHistoryLength`               | `number`                                                                                              | **Default:** 20. allows you to increase the number of queries in the history component                                                                                                          | 20 |

### Children (this pattern will be dropped in 2.0.0)

- `<GraphiQL.Logo>`: Replace the GraphiQL logo with your own.

- `<GraphiQL.Toolbar>`: Add a custom toolbar above GraphiQL. If not provided, a
  default toolbar may contain common operations. Pass the empty
  `<GraphiQL.Toolbar />` if an empty toolbar is desired.

- `<GraphiQL.Button>`: Add a button to the toolbar above GraphiQL.

- `<GraphiQL.Menu>`: Add a dropdown menu to the toolbar above GraphiQL.

  - `<GraphiQL.MenuItem>`: Items for a menu.

- `<GraphiQL.Select>`: Add a select list to the toolbar above GraphiQL.

  - `<GraphiQL.SelectOption>`: Options for a select list.

- `<GraphiQL.Group>`: Add a group of associated controls to the
  toolbar above GraphiQL. Expects children to be `<GraphiQL.Button>`,
  `<GraphiQL.Menu>`, or `<GraphiQL.Select>`.

- `<GraphiQL.Footer>`: Add a custom footer below GraphiQL Results.

## Full Usage Example

TODO: kitchen sink example project or codesandbox

### Applying an Editor Theme

In order to theme the editor portions of the interface, you can supply a `editorTheme` prop. You'll also need to load the appropriate CSS for the theme (similar to loading the CSS for this project). [See the themes available here](https://codemirror.net/demo/theme.html).

```js
// In your html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.23.0/theme/solarized.css" />

// In your GraphiQL JSX
<GraphiQL
  editorTheme="solarized light"
/>
```
