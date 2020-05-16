# Monaco GraphQL

GraphQL language plugin for the Monaco Editor. You can use it to build vscode/codespaces-like web or desktop IDEs using whatever frontend javascript libraries or frameworks you want (or even vanilla - see [the webpack example](../../examples/monaco-graphql-webpack/)).

> **NOTE:** This is still in pre-release state. Helping out with this project will help advance GraphiQL and many other GraphQL IDE projects. `codemirror-graphql` still has some more nuanced features

It provides the following features while editing GraphQL files:

- Code completion (schema driven)
- Hover (schema driven)
- Validation (schema driven)
- Formatting - using prettier
- Syntax Highlighting
- Configurable schema loading (or custom)
- Configurable formatting options

## Usage

For now, we use `language` id of `graphqlDev` until we can ensure we can dovetail nicely with the official `graphql` language ID.

To use with webpack, here is an example to get you started:

```shell
yarn add monaco-graphql
```

```ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import 'monaco-graphql/esm/monaco.contribution';

import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
import GraphQLWorker from 'worker-loader!monaco-graphql/esm/graphql.worker';

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphqlDev') {
      return new GraphQLWorker();
    }
    return new EditorWorker();
  },
};
monaco.editor.create(document.getElementById('someElementId'), {
  value: 'query { }',
  language: 'graphqlDev',
});

monaco.languages.graphql.graphqlDefaults.setSchemaUri(
  'https://localhost:1234/graphql',
);
```

This will cover the basics, making an HTTP POST with the default `introspectionQuery()` operation. To customize the entire fetcher, see [advanced customization]() below

## Advanced Usage

### `monaco.languages.graphql.graphqlDefaults` ([typedoc](http://graphiql-test.netlify/typedoc/interfaces/monaco_graphql.monaco.languages.graphql.languageservicedefaults))

If you call any of these API methods to modify the language service configuration at any point at runtime, the webworker will reload relevant language features.

If you call any of these directly after `monaco.editor.create()`, they will be the first configurations to take effect, making this the first order service instantiation pattern.

verbs prefixes for methods are meaningful:

- `set...` means to force re-write the whole settings entry for that method
- `update...` means a shallow merge of the object/value you pass with the rest of the existing settings

#### `graphqlDefaults.updateSchemaConfig()`

set schema `uri` (required) as well as `requestOptions`, `buildSchemaConfig` and `introspectionOptions`, with a shallow merge.
invoking these will cause the webworker to reload language services

```ts
monaco.languages.graphql.graphqlDefaults.updateSchemaConfig({
  uri: '',
});
```

#### `graphqlDefaults.setSchemaConfig()`

same as the above, except it overwrites the entire schema config

```ts
monaco.languages.graphql.graphqlDefaults.updateSchemaConfig({
  uri: 'https://my/schema',
  requestOptions: {
    headers: { Authorization: 'Bear Auth 2134' },
  },
});
```

#### `graphqlDefaults.setSchemaUri()`

You can also just change the schema uri directly!

```ts
monaco.languages.graphql.graphqlDefaults.setSchemaUri(
  'https://localhost:1234/graphql',
);
```

#### `graphqlDefaults.setModeConfiguration()`

This is where you can toggle monaco language features. all are enabled by default.

```ts
monaco.languages.graphql.graphqlDefaults.setModeConfiguration({
  documentFormattingEdits: true;
  completionItems: true;
  hovers: true;
  documentSymbols: true;
  diagnostics: true;
})
```

#### `graphqlDefaults.setFormattingOptions()`

this accepts an object `{ prettierConfig: prettier.Options }`, which accepts [any prettier option](https://prettier.io/docs/en/options.html).
it will not re-load the schema or language features, however the new prettier options will take effect.

this method overwrites the previous configuration, and will only accept static values that can be passed between the main/worker process boundary.

```ts
graphqlDefaults.setFormattingOptions({
  // if you wanna be like that
  prettierOptions: { tabWidth: 2, useTabs: true },
});
```

### `monaco.languages.graphql.api` ([typedoc](http://graphiql-test.netlify/typedoc/classes/monaco_graphql.monacographqlapi))

#### `api.getSchema()`

Returns either an AST `DocumentNode` or `IntrospectionQuery` result json using default or provided `schemaLoader`

### `api.parse()`

parse graphql from string using webworkers (less render-blocking/multi-threaded CPU/etc)

## Webpack Usage

you'll need to refer to the webpack configuration in the [full monaco webpack example](/examples/monaco-graphql-webpack#readme) for this example to work in webpack.

more examples coming soon!

## Custom Webworker (for passing non-static config to worker)

If you want to pass a custom parser and/or schema fetching module, it is supported, however the setup is a bit more complicated.

This is because we can't pass non-static configuration to the existing worker programatically, so you must import these and build the worker custom with those functions. Part of the (worthwile) cost of crossing runtimes!

you'll want to create your own `mygraphql.worker.ts` file, and add your custom config such as `schemaLoader` to `createData`:

```ts
import type { worker as WorkerNamespace } from 'monaco-editor';
// @ts-ignore
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';

import { GraphQLWorker } from 'monaco-graphql/esm/GraphQLWorker';

import mySchemaLoader from './my-schema-loader';

self.onmessage = () => {
  try {
    worker.initialize(
      (
        ctx: WorkerNamespace.IWorkerContext,
        createData: monaco.languages.graphql.ICreateData,
      ) => {
        createData.schemaLoader = mySchemaLoader;
        return new GraphQLWorker(ctx, createData);
      },
    );
  } catch (err) {
    throw err;
  }
};
```

then, in your application:

```ts
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';

// specify the path to your language worker
import GraphQLWorker from 'worker-loader!./mygraphql.worker';

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphqlDev') {
      return new GraphQLWorker();
    }
    return new EditorWorker();
  },
};
```

## Monaco Editor Tips

If you are familiar with Codemirror/Atom-era terminology and features, here's some gotchas:

- "hinting" => "code completion" in LSP terminology
- "linting" => "diagnostics" " "
- the default keymap is different, more vscode like
- command palette and right click context menu are important
- you can extend the standard completion/linting/etc provided. for example, `editor.setModelMarkers()`

## TODO

- [ ] variables JSON validation
- [ ] variables completion
- [ ] Symbols & Definitions
- [ ] file uri-driven config/schema
- [ ] schema <-> operation references
