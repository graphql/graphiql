# GraphiQL

[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)
[![npm](https://img.shields.io/npm/v/graphiql.svg)](https://www.npmjs.com/package/graphiql)
[![License](https://img.shields.io/npm/l/graphiql.svg?style=flat-square)](LICENSE)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql).

[![](resources/graphiql.png)](http://graphql.org/swapi-graphql)

## Features

- Syntax highlighting
- Intelligent type ahead of fields, arguments, types, and more.
- Real-time error highlighting and reporting.
- Automatic query completion.
- Run and inspect query results.
- Subscriptions support
- Highly customizeable for any HTTP/etc GraphQL services 
  - any way that a GraphQL schema can be executed with a promise is supported. Howeve, currently only JSON results are supported.
- Explore your schema
  - Clicking GraphQL query keywords and fields shows the item in docs
  - GraphQL Schema types are searchable
  - Renders your Type descriptions with markdown
- Improved accessibility

## Getting started

GraphiQL is used for many purposes, in many contexts. Thus, there are a number of ways to use GraphiQL in your project.



### CDN Bundle

Just a simple index.html file and something like below will get you started:

```html
<div id="graphiql">Loading...</div>
  <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
  <script type="text/javascript" src="https://unpkg.com/browse/graphiql@latest/graphiql.render.min.js"></script>
  <script>
    renderGraphiQL({ 
      containerId: 'graphiql', 
      url: 'http://my.graphql.api/graphql'
    })
  </script>
```

View the complete example [in the usage docs](#browser-bundles).

### Webpack and Bundlers

If you are using webpack or a bundler, you can import our GraphiQL npm package, and begin work on your purpose built implementation, whether minimal or complex.

Furthermore with this strategy, you are able to customize bundling further, in terms of browser targeting, using dynamic imports and otherwise.

```
npm install --save graphiql
```

Alternatively, if you are using [`yarn`](https://yarnpkg.com/):

```
yarn add graphiql
```

GraphiQL provides a React component responsible for rendering the UI, which should be provided with a function for fetching from GraphQL, we recommend using the [fetch](https://fetch.spec.whatwg.org/) standard API.

```ts
import React from 'react';
import ReactDOM from 'react-dom';
import { ExecutionResult } from 'graphql'
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';

import 'graphiql/graphiql.css'

interface GraphQLParams { query: string, variables: any, operationName: string }

async function graphQLFetcher(graphQLParams: GraphQLParams): Promise<ExecutionResult> {
  const response = await fetch(window.location.origin + '/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphQLParams),
  })
  return response.json()
}

ReactDOM.render(<GraphiQL fetcher={graphQLFetcher} />, document.body);
```

You can build your own bundles for the web with [webpack](https://webpack.js.org/), rollup, metro bundler, etc.

See the [webpack example](../examples/graphiql-webpack/) here in the monorepo to learn how to bundle up GraphiQL for your own purpose-built implementation.



### Usage

GraphiQL exports a single React component which is intended to encompass the entire browser viewport. This React component renders the GraphiQL editor.

```js
import GraphiQL from 'graphiql';

<GraphiQL />;
```

GraphiQL supports customization in UI and behavior by accepting React props and children.

#### GraphiQL Props:

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

#### Children:

Each of these are components that can be set directly. For example:

```js
import GraphiQL from 'graphiql'
GraphiQL.Logo = <Icon><CustomLogo></Icon>
```

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

### Browser Bundles

There are several provided browser bundles. They target the browsers in the [`.browserslistrc`](.browserslistrc) file - `last 2 versions` of firefox, chrome, edge, and safari. IE is not supported anymore. If you'd like to customize further the browser targeting or bundling strategy, see the [bundlers section](#webpack-and-bundlers)

All of them require `react` and `react-dom` as externals. You can use [React's reccomendations for loading their libraries from CDN](https://reactjs.org/docs/cdn-links.html).


#### Complete CDN Example
Here is a complete example of the easiest to use bundle, which just exports a global function `renderGraphiQL`:

```html
<!DOCTYPE html>
<html>

<head>
  <style>
    body {
      height: 100%;
      margin: 0;
      width: 100%;
      overflow: hidden;
    }

    #graphiql {
      height: 100vh;
    }
  </style>
  <link  rel="stylesheet" href="https://unpkg.com/browse/graphiql@latest/graphiql.css" />
</head>

<body>
  <div id="graphiql">Loading...</div>
  <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
  <script type="text/javascript" src="https://unpkg.com/browse/graphiql@latest/graphiql.render.min.js"></script>
  <script>
    loginToMyService().then(token => {
      renderGraphiQL({ 
        containerId: 'graphiql', 
        url: 'https://my.graphql.service/graphql',
        headers: {
          Authorization: "Bearer " + token
        }
      })
    })
  </script>
</body>

</html>

```

If you don't supply a custom `fetcher` function, but you do supply a `url`, then it will try to `POST` a standard GraphQL HTTP request to that URL, as well as retrieve the introspection schema from that URL.

We reccomend using `unpkg` over cdnjs, as does react. The updates to their CDN are almost instantaneous. GraphiQL 0.x.y will be undergoing a lot of changes and releases before we get to a stable version.

#### CDN Bundle: graphiql.min.js

The `graphiql.min.js` continues to work as always. Here's how to acheive the same implementation as above.
Note that the second argument to `React.createElement` are [the props for GraphiQL](#graphiql-props).

```js
<div id="graphiql">Loading...</div>
<script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
<script type="text/javascript" src="https://unpkg.com/browse/graphiql@latest/graphiql.min.js"></script>
<script>
  const getFetcher = token => async (graphQLParams) => {
   const result = await fetch('https://my.graphql.service/graphql', { 
     headers: { 
       Authorization: "Bearer " + token, 
       Content-type: 'application/json'
     }, 
     method: "POST"
    })
    return result.json()
  }
  loginToMyService().then(token => {
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: getFetcher(token)
      }),
      document.getElementById('graphiql')
    );
  }
</script>
```

### Usage Examples

```js
GraphiQL.Logo = <div>Custom Logo</div>


class CustomGraphiQL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // REQUIRED:
      // `fetcher` must be provided in order for GraphiQL to operate
      fetcher: this.props.fetcher
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
