# GraphiQL

[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)
[![npm](https://img.shields.io/npm/v/graphiql.svg)](https://www.npmjs.com/package/graphiql)
[![License](https://img.shields.io/npm/l/graphiql.svg?style=flat-square)](LICENSE)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql).

[![](https://raw.githubusercontent.com/graphql/graphiql/HEAD/resources/graphiql.png)](http://graphql.org/swapi-graphql)

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


## Demos

We have a few demos of `master` branch via the default netlify build (the same URL paths apply to deploy previews on PRs):

1. [`graphiql.min.js` demo](https://graphiql-test.netlify.com/) - the min.js bundle for the current ref
2. [`graphiql.js` demo](https://graphiql-test.netlify.com/dev) - development build is nice for react inspector, debugging, etc
3. [webpack example](https://graphiql-test.netlify.com/webpack) - Demonstration of webpack usage from `examples/graphiql-webpack`
4. [cdn example](https://graphiql-test.netlify.com/cdn) - Demonstration of usage of our @latest CDN package release. Similar to 1) but for the last actual npm release.
5. [bundle analyzer for graphiql.min.js](https://graphiql-test.netlify.com/analyzer)

## Getting started

Build for the web with [webpack](https://webpack.js.org/) or [browserify](http://browserify.org/), or use the pre-bundled `graphiql.js` file. See the [cdn example](../examples/graphiql-cdn/) in the git repository to see how to use the pre-bundled file, or see the [webpack example](../examples/graphiql-webpack) to see how to bundle an application using the `GraphiQL` component.

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

though this doesnt include runtimes or libraries where `graphiql` is used isn't referenced in the package registry search entry

### CDN Bundle

Don't forget to include the CSS file on the page! If you're using `npm` or `yarn`, you can find it in `node_modules/graphiql/graphiql.css`, or you can download it from the [releases page](https://github.com/graphql/graphiql/releases).

For an example of setting up a GraphiQL, check out the [example](../examples/graphiql-cdn/) in this repository which also includes a few useful features highlighting GraphiQL's API.

The most minimal way to set up GraphiQL is a single index.html file:

```html
<html>
  <head>
    <title>Simple GraphiQL Example</title>
    <link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
  </head>
  <body style="margin: 0;">
    <div id="graphiql" style="height: 100vh;"></div>

    <script crossorigin src="https://unpkg.com/react/umd/react.min.js"></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom/umd/react-dom.min.js"
    /></script>
    <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js" />

    <script>
      function graphQLFetcher(graphQLParams) {
        return fetch('https://my/graphql', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graphQLParams),
        }).then(function(response) {
          return response.json();
        });
      }
      ReactDOM.render(
        React.createElement(GraphiQL, { fetcher: graphQLFetcher }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
```

**Notes**:

- the inlined styles are important for ensuring GraphiQL is visible and fills the canvas.
- using `React.createElement` directly is belaborous, so follow the webpack instructions below for more highly customized implementation

### Webpack/Bundler

**Note**: If you are having webpack issues or questions about webpack, make sure you've cross-referenced your webpack configuration with our own [webpack example](../examples/graphiql-webpack) first. We confirm that this builds on every travis CI run, and that it works end to end with every publish.

Using another GraphQL service? GraphiQL is pretty easy to set up.

With `yarn`:

```
npm install --save graphiql
```

Alternatively, if you are using [`yarn`](https://yarnpkg.com/):

```
yarn add graphiql
```

GraphiQL provides a React component responsible for rendering the UI, which should be provided with a function for fetching from GraphQL, we recommend using the [fetch](https://fetch.spec.whatwg.org/) standard API.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';

function graphQLFetcher(graphQLParams) {
  return fetch(window.location.origin + '/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphQLParams),
  }).then(response => response.json());
}

ReactDOM.render(<GraphiQL fetcher={graphQLFetcher} />, document.body);
```

## Options

GraphiQL supports customization in UI and behavior by accepting React props and children.

### Props

- `fetcher`: a function which accepts GraphQL-HTTP parameters and returns a Promise or Observable which resolves to the GraphQL parsed JSON response.

- `schema`: a GraphQLSchema instance or `null` if one is not to be used. If `undefined` is provided, GraphiQL will send an introspection query using the fetcher to produce a schema.

- `query`: an optional GraphQL string to use as the initial displayed query, if `undefined` is provided, the stored query or `defaultQuery` will be used.

- `variables`: an optional GraphQL string to use as the initial displayed query variables, if `undefined` is provided, the stored variables will be used.

- `operationName`: an optional name of which GraphQL operation should be executed.

- `response`: an optional JSON string to use as the initial displayed response. If not provided, no response will be initially shown. You might provide this if illustrating the result of the initial query.

- `storage`: an instance of [Storage][] GraphiQL will use to persist state. Default: `window.localStorage`.

- `defaultQuery`: an optional GraphQL string to use when no query is provided and no stored query exists from a previous session. If `undefined` is provided, GraphiQL will use its own default query.

- `defaultVariableEditorOpen`: an optional boolean that sets whether or not to show the variables pane on startup. If not defined, it will be based off whether or not variables are present.

- `onEditQuery`: an optional function which will be called when the Query editor changes. The argument to the function will be the query string.

- `onEditVariables`: an optional function which will be called when the Query variable editor changes. The argument to the function will be the variables string.

- `onEditOperationName`: an optional function which will be called when the operation name to be executed changes.

- `onToggleDocs`: an optional function which will be called when the docs will be toggled. The argument to the function will be a boolean whether the docs are now open or closed.

- `getDefaultFieldNames`: an optional function used to provide default fields to non-leaf fields which invalidly lack a selection set. Accepts a GraphQLType instance and returns an array of field names. If not provided, a default behavior will be used.

- `editorTheme`: an optional string naming a CodeMirror theme to be applied to the `QueryEditor`, `ResultViewer`, and `Variables` panes. Defaults to the `graphiql` theme. See below for full usage.

- `readOnly`: an optional boolean which when `true` will make the `QueryEditor` and `Variables` panes readOnly.

- `docExplorerOpen`: an optional boolean which when `true` will ensure the `DocExplorer` is open by default when the user first renders the component. If the user has toggled the doc explorer on/off following this, however, the persisted UI state will override this default flag.

### Children

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

Here's a more complex react implementation. This would require webpack or a bundler.

```js
class CustomGraphiQL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // REQUIRED:
      // `fetcher` must be provided in order for GraphiQL to operate
      fetcher: this.props.fetcher,

      // OPTIONAL PARAMETERS
      // GraphQL artifacts
      query: '',
      variables: '',
      response: '',

      // GraphQL Schema
      // If `undefined` is provided, an introspection query is executed
      // using the fetcher.
      schema: undefined,

      // Useful to determine which operation to run
      // when there are multiple of them.
      operationName: null,
      storage: null,
      defaultQuery: null,

      // Custom Event Handlers
      onEditQuery: null,
      onEditVariables: null,
      onEditOperationName: null,

      // GraphiQL automatically fills in leaf nodes when the query
      // does not provide them. Change this if your GraphQL Definitions
      // should behave differently than what's defined here:
      // (https://github.com/graphql/graphiql/blob/master/src/utility/fillLeafs.js#L75)
      getDefaultFieldNames: null
    };
  }

  // Example of using the GraphiQL Component API via a toolbar button.
  handleClickPrettifyButton(event) {
    const editor = this.graphiql.getQueryEditor();
    const currentText = editor.getValue();
    const { parse, print } = require('graphql');
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  }

  render() {
    return (
      <GraphiQL ref={c => { this.graphiql = c; }} {...this.state}>
        <GraphiQL.Logo>
          Custom Logo
        </GraphiQL.Logo>
        <GraphiQL.Toolbar>

          // GraphiQL.Button usage
          <GraphiQL.Button
            onClick={this.handleClickPrettifyButton}
            label="Prettify"
            title="Prettify Query (Shift-Ctrl-P)"
          />

          // Some other possible toolbar items
          <GraphiQL.Menu label="File" title="File">
            <GraphiQL.MenuItem label="Save" title="Save" onSelect={...}>
          </GraphiQL.Menu>

          <OtherReactComponent someProps="true" />

        </GraphiQL.Toolbar>
        <GraphiQL.Footer>
          // Footer works the same as Toolbar
          // add items by appending child components
        </GraphiQL.Footer>
      </GraphiQL>
    );
  }
}
```

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

### Query Samples

**Query**

GraphQL queries declaratively describe what data the issuer wishes to fetch from whoever is fulfilling the GraphQL query.

```graphql
query FetchSomeIDQuery($someId: String!) {
  human(id: $someId) {
    name
  }
}
```

More examples available from: [GraphQL Queries](http://graphql.org/docs/queries/).

**Mutation**

Given this schema,

```js
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    fields: {
      numberHolder: { type: numberHolderType },
    },
    name: 'Query',
  }),
  mutation: new GraphQLObjectType({
    fields: {
      immediatelyChangeTheNumber: {
        type: numberHolderType,
        args: { newNumber: { type: GraphQLInt } },
        resolve: function(obj, { newNumber }) {
          return obj.immediatelyChangeTheNumber(newNumber);
        },
      },
    },
    name: 'Mutation',
  }),
});
```

then the following mutation queries are possible:

```graphql
mutation TestMutation {
  first: immediatelyChangeTheNumber(newNumber: 1) {
    theNumber
  }
}
```

Read more in [this mutation test in `graphql-js`](https://github.com/graphql/graphql-js/blob/master/src/execution/__tests__/mutations-test.js).

[Relay](https://relay.dev/) has another good example using a common pattern for composing mutations. Given the following GraphQL Type Definitions,

```graphql
input IntroduceShipInput {
  factionId: ID!
  shipName: String!
  clientMutationId: String!
}

type IntroduceShipPayload {
  faction: Faction
  ship: Ship
  clientMutationId: String!
}
```

mutation calls are composed as such:

```graphql
mutation AddBWingQuery($input: IntroduceShipInput!) {
  introduceShip(input: $input) {
    ship {
      id
      name
    }
    faction {
      name
    }
    clientMutationId
  }
}
{
  "input": {
    "shipName": "B-Wing",
    "factionId": "1",
    "clientMutationId": "abcde"
  }
}
```

Read more from [Relay Mutation Documentation](https://relay.dev/docs/en/graphql-server-specification.html#mutations).

**Fragment**

Fragments allow for the reuse of common repeated selections of fields, reducing duplicated text in the document. Inline Fragments can be used directly within a selection to condition upon a type condition when querying against an interface or union. Therefore, instead of the following query:

```graphql
{
  luke: human(id: "1000") {
    name
    homePlanet
  }
  leia: human(id: "1003") {
    name
    homePlanet
  }
}
```

using fragments, the following query is possible.

```graphql
{
  luke: human(id: "1000") {
    ...HumanFragment
  }
  leia: human(id: "1003") {
    ...HumanFragment
  }
}

fragment HumanFragment on Human {
  name
  homePlanet
}
```

Read more from [GraphQL Fragment Specification](https://graphql.github.io/graphql-spec/draft/#sec-Language.Fragments).
