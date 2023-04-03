# CodeMirror 6 GraphQL Language extension

[![NPM](https://img.shields.io/npm/v/cm6-graphql.svg?style=flat-square)](https://npmjs.com/cm6-graphql)
![npm downloads](https://img.shields.io/npm/dm/cm6-graphql?label=npm%20downloads)
[![License](https://img.shields.io/npm/l/cm6-graphql.svg?style=flat-square)](LICENSE)
[Discord Channel](https://discord.gg/cffZwk8NJW)

Provides CodeMirror 6 extension with a parser mode for GraphQL along with a autocomplete and linting powered by your GraphQL Schema.

### Getting Started

```sh
npm install --save cm6-graphql
```

[CodeMirror 6](https://codemirror.net/) customization is done through [extensions](https://codemirror.net/docs/guide/#extension). This package an extension that customizes codemirror 6 for GraphQL.

```js
import {basicSetup, EditorView} from 'codemirror';
import {graphql} from 'cm6-graphql';

const view = new EditorView({
  doc: `mutation mutationName {
    setString(value: "newString")
  }`,
  extensions: [
    basicSetup,
    graphql(myGraphQLSchema),
  ],
  parent: document.body
})

```

Note: You have to provide a theme to codemirror 6 for the styling you want. You can take a look at [this example](https://github.com/graphql/graphiql/blob/main/examples/cm6-graphql-parcel/src/index.ts) or see the codemirror 6 [documentation examples](https://codemirror.net/examples/styling/) for more details.

### Updating schema

If you need to update the GraphQL schema used in the editor dynamically, you can call `updateSchema` with the codemirror `EditorView` instance and the new schema

```js
import {updateSchema} from 'cm6-graphql';

const onNewSchema = (schema) => {
  updateSchema(view, schema);
};
```
