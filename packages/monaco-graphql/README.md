[Discord Channel](https://discord.gg/r4BxrAG6fN)

# Monaco GraphQL

GraphQL language plugin for the Monaco Editor. You can use it to build vscode/codespaces-like web or desktop IDEs using whatever frontend javascript libraries or frameworks you want, or none!

- [webpack example](https://github.com/graphql/graphiql/tree/main/examples/monaco-graphql-webpack/) using plain javascript
- [graphiql 2.x RFC example](https://github.com/graphql/graphiql/tree/main/packages/graphiql-2-rfc-context/) using react 16
- [live demo](https://monaco-graphql.netlify.com) of the monaco webpack example (prompts for github access token!)

> **NOTE:** This is in pre-release state as we build towards GraphiQL 2.0.x. [`codemirror-graphql`](https://github.com/graphql/graphiql/tree/main/packages/codemirror-graphql) has more features (such as JSON variables validation) and is more stable.

## Features

It provides the following features while editing GraphQL files:

- Code completion (schema driven)
- Hover (schema driven)
- Validation (schema driven)
- Formatting - using prettier
- Syntax Highlighting
- Configurable schema loading (or custom) - only handles a single schema currently
- Configurable formatting options
- Providing external fragments

## Usage

For now, we use `language` id of `graphqlDev` until we can ensure we can dovetail nicely with the official `graphql` language ID.

To use with webpack, here is an example to get you started:

```shell
yarn add monaco-graphql
```

```ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { api as GraphQLAPI } from 'monaco-graphql/esm/monaco.contribution';

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
  formatOnPaste: true,
});

GraphQLAPI.setSchemaUri('https://localhost:1234/graphql');
```

This will cover the basics, making an HTTP POST with the default `introspectionQuery()` operation. To customize the entire fetcher, see [advanced customization]() below. For more customization options, see the [Monaco Editor API Docs](https://microsoft.github.io/monaco-editor/api/index.html)

## Advanced Usage

### `GraphQLAPI` ([typedoc](https://graphiql-test.netlify.app/typedoc/classes/monaco_graphql.languageserviceapi.html))

If you call any of these API methods to modify the language service configuration at any point at runtime, the webworker will reload relevant language features.

If you call any of these directly after `monaco.editor.create()`, they will be the first configurations to take effect, making this the first order service instantiation pattern.

verbs prefixes for methods are meaningful:

- `set...` means to force re-write the whole settings entry for that method
- `update...` means a shallow merge of the object/value you pass with the rest of the existing settings

#### `GraphQLAPI.updateSchemaConfig()`

set schema `uri` (required) as well as `requestOptions`, `buildSchemaConfig` and `introspectionOptions`, with a shallow merge.
invoking these will cause the webworker to reload language services

```ts
GraphQLAPI.updateSchemaConfig({
  requestOptions: {
    headers: { Authorization: 'Bear Auth 2134' },
  },
});
```

#### `GraphQLAPI.setSchemaConfig()`

same as the above, except it overwrites the entire schema config

```ts
GraphQLAPI.setSchemaConfig({
  uri: 'https://my/schema',
  requestOptions: {
    headers: { Authorization: 'Bear Auth 2134' },
  },
});
```

#### `GraphQLAPI.setSchemaUri()`

You can also just change the schema uri directly!

```ts
GraphQLAPI.setSchemaUri('https://localhost:1234/graphql');
```

#### `GraphQLAPI.setSchema()`

With either a [`RawSchema`](https://graphiql-test.netlify.app/typedoc/modules/graphql_language_service.html#rawschema-2) - an SDL string or an `introspectionQuery` JSON, set the schema directly, bypassing the schema fetcher.
We can't use a programattic `GraphQLSchema` instance, since this needs to be used by the webworker.

```ts
GraphQLAPI.setSchema(rawSchema);
```

#### `GraphQLAPI.setModeConfiguration()`

This is where you can toggle monaco language features. all are enabled by default.

```ts
GraphQLAPI.setModeConfiguration({
  documentFormattingEdits: true,
  completionItems: true,
  hovers: true,
  documentSymbols: true,
  diagnostics: true,
});
```

#### `GraphQLAPI.setFormattingOptions()`

this accepts an object `{ prettierConfig: prettier.Options }`, which accepts [any prettier option](https://prettier.io/docs/en/options.html).
it will not re-load the schema or language features, however the new prettier options will take effect.

this method overwrites the previous configuration, and will only accept static values that can be passed between the main/worker process boundary.

```ts
GraphQLAPI.setFormattingOptions({
  // if you wanna be like that
  prettierOptions: { tabWidth: 2, useTabs: true },
});
```

#### `GraphQLAPI.setExternalFragmentDefintions()`

Append external fragments to be used by autocomplete and other language features.

This accepts either a string that contains fragment definitions, or `TypeDefinitionNode[]`

#### `GraphQLAPI.getSchema()`

Returns either an AST `DocumentNode` or `IntrospectionQuery` result json using default or provided `schemaLoader`

### `GraphQLAPI.parse()`

parse graphql from string using webworkers (less render-blocking/multi-threaded CPU/etc)

## Webpack Usage

you'll need to refer to the webpack configuration in the [full monaco webpack example](/examples/monaco-graphql-webpack#readme) for this example to work in webpack.

more examples coming soon!

## Custom Webworker (for passing non-static config to worker)

If you want to pass a custom parser and/or schema fetching module, it is supported, however the setup is a bit more complicated.

You can add any `LanguageServiceConfig` configuration options you like here to `languageConfig` as below.

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
        createData.languageConfig.schemaLoader = mySchemaLoader;
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
- "linting" => "diagnostics" in lsp terminology
- the default keymap is different, more vscode like
- command palette and right click context menu are important
- you can extend the standard completion/linting/etc provided. for example, `editor.setModelMarkers()`
- [Monaco Editor API Docs](https://microsoft.github.io/monaco-editor/api/index.html)
- [Monaco Editor Samples](https://github.com/Microsoft/monaco-editor-samples) repository is great for tips on implementing with different bundlers, runtimes, etc

## TODO

- [ ] variables JSON validation
- [ ] variables completion
- [ ] Symbols & Definitions
- [ ] file uri-driven config/schema
- [ ] schema <-> operation references
