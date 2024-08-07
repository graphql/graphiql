# CodeMirror 6 GraphQL Language extension

[![NPM](https://img.shields.io/npm/v/cm6-graphql.svg?style=flat-square)](https://npmjs.com/cm6-graphql)
![npm downloads](https://img.shields.io/npm/dm/cm6-graphql?label=npm%20downloads)
[![License](https://img.shields.io/npm/l/cm6-graphql.svg?style=flat-square)](LICENSE)
[Discord Channel](https://discord.gg/cffZwk8NJW)

Provides CodeMirror 6 extension with a parser mode for GraphQL along with
autocomplete and linting powered by your GraphQL Schema.

### Getting Started

```sh
npm install cm6-graphql
```

[CodeMirror 6](https://codemirror.net/) customization is done through
[extensions](https://codemirror.net/docs/guide/#extension). This package is
an extension that customizes CodeMirror 6 for GraphQL.

```js
import { basicSetup, EditorView } from 'codemirror';
import { graphql } from 'cm6-graphql';

const view = new EditorView({
  doc: `mutation mutationName {
    setString(value: "newString")
  }`,
  extensions: [basicSetup, graphql(myGraphQLSchema)],
  parent: document.body,
});
```

_**Note:** You have to provide a theme to CodeMirror 6 for the styling you want. You
can take a look at
[this example](https://github.com/graphql/graphiql/blob/main/examples/cm6-graphql-parcel/src/index.ts)
or see the CodeMirror 6
[documentation examples](https://codemirror.net/examples/styling/) for more
details._

### Updating schema

If you need to dynamically update the GraphQL schema used in the editor, you can
call `updateSchema` with the CodeMirror `EditorView` instance and the new schema

```js
import { updateSchema } from 'cm6-graphql';

const onNewSchema = schema => {
  updateSchema(view, schema);
};
```
