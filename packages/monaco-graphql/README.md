[Changelog](https://github.com/graphql/graphiql/blob/main/packages/monaco-graphql/CHANGELOG.md)
|
[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphql_language_service_server.html)
| [Discord Channel](https://discord.gg/r4BxrAG6fN)

GraphQL language plugin for the Monaco Editor. You can use it to build
vscode/codespaces-like web or desktop IDEs using whatever frontend javascript
libraries or frameworks you want, or none!

- [webpack example](https://github.com/graphql/graphiql/tree/main/examples/monaco-graphql-webpack)
  using plain javascript, shows how to change schemas
- [vite + react example](https://stackblitz.com/edit/monaco-graphql-react-vite?file=src%2FApp.tsx&terminal=dev) -
  minimal example with variables (C)JSON support using react
- [live demo](https://monaco-graphql.netlify.com) of the monaco webpack example
  (prompts for GitHub access token!)

> **NOTE:** This is in pre-release state as we build towards GraphiQL 2.0.x.
> [`codemirror-graphql`](https://github.com/graphql/graphiql/tree/main/packages/codemirror-graphql)
> has more features (such as JSON variables validation) and is more stable.

## Features

It provides the following features while editing GraphQL files:

- Configurable multi-model, multi-schema language worker with `fileMatch`
  expressions
- Code completion (schema driven) for Operation and SDL types
  - Automatic expansion & completion on leaf type completion
- Hover (schema driven) with markdown support
- Validation (schema driven)
- JSON Variables validation and language features (schema driven)
- Formatting - using prettier
- Syntax Highlighting & Basic Languages provided by `monaco-editor` basic
  languages support
- Configurable formatting options
- Providing external fragments
- create custom workers for custom language service options - parser, validation
  rules, schemaBuilder, etc

## Usage

For now, we use `language` id of `graphql` until we can ensure we can dovetail
nicely with the official `graphql` language ID.

To use with webpack, here is an example to get you started:

```sh
yarn add monaco-graphql
```

## Sync Example

```ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { initializeMode } from 'monaco-graphql';

// you can also configure these using the webpack or vite plugins for `monaco-editor`
import GraphQLWorker from 'worker-loader!monaco-graphql/graphql.worker';

// instantiates the worker & language features with the schema!
const MonacoGraphQLAPI = initializeMode({
  schemas: [
    {
      schema: myGraphqlSchema as GraphQLSchema,
      // anything that monaco.URI.from() is compatible with
      uri: 'https://my-schema.com',
      uri: '/my-schema.graphql',
      // match the monaco file uris for this schema.
      // accepts specific uris and anything `picomatch` supports.
      // (everything except bracket regular expressions)
      fileMatch: ['**/*.graphql'],
      // note: not sure if ^ works if the graphql model is using urls for uris?
    },
  ],
});

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphql') {
      return new GraphQLWorker();
    }
    // if you are using vite or webpack plugin, it will be found here
    return new Worker('editor.worker.js');
  },
};
monaco.editor.create(document.getElementById('someElementId'), {
  value: 'query { }',
  language: 'graphql',
  formatOnPaste: true,
});
```

## Lazy Example

The existing API works as before in terms of instantiating the schema

```ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// enables our language worker right away, despite no schema
import 'monaco-graphql/monaco.contribution';

// you can also configure these using the webpack or vite plugins for `monaco-editor`
import GraphQLWorker from 'worker-loader!monaco-graphql/graphql.worker';

// lazily invoke the api config methods whenever we want!
monaco.languages.graphql.setSchemaConfig([
  {
    schema: myGraphqlSchema as GraphQLSchema,
    // anything that monaco.URI.from() is compatible with
    uri: 'https://my-schema.com',
    uri: '/my-schema.graphql',
    // match the monaco file uris for this schema.
    // accepts specific uris and anything `picomatch` supports.
    // (everything except bracket regular expressions)
    fileMatch: ['**/*.graphql'],
    // note: not sure if ^ works if the graphql model is using urls for uris?
  },
]);

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphql') {
      return new GraphQLWorker();
    }
    return new Worker('editor.worker.js');
  },
};
monaco.editor.create(document.getElementById('someElementId'), {
  value: 'query { }',
  language: 'graphql',
  formatOnPaste: true,
});
```

This will cover the basics, making an HTTP POST with the default
`introspectionQuery()` operation. To customize the entire fetcher, see
[advanced customization]() below. For more customization options, see the
[Monaco Editor API Docs](https://microsoft.github.io/monaco-editor/api/index.html)

## Advanced Usage

### Variables JSON Support!

In `monaco-graphql@0.5.0` we introduced a method `getVariablesJSONSchema` that
allows you to retrieve a `JSONSchema` description for the declared variables for
any given set of operations

## Full Sync Demo with Variables JSON

```ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { initializeMode } from 'monaco-graphql';

import GraphQLWorker from 'worker-loader!monaco-graphql/graphql.worker';

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'graphql') {
      return new GraphQLWorker();
    }
    return new Worker('editor.worker.js');
  },
};

// the language service will be instantiated once the schema is available
const MonacoGraphQLAPI = initializeMode({
  schemas: [
    {
      // anything that monaco.URI.from() is compatible with
      uri: 'https://my-schema.com',
      // match the monaco file uris for this schema.
      // accepts specific filenames and anything `picomatch` supports.
      fileMatch: ['**/*.graphql'],
      schema: myGraphqlSchema as GraphQLSchema,
    },
  ],
});

const operationModel = monaco.editor.createModel(
  'query {}',
  'graphql',
  '/operation.graphql',
);

const operationEditor = monaco.editor.create(
  document.getElementById('someElementId'),
  {
    model: operationModel,
    language: 'graphql',
    formatOnPaste: true,
  },
);

const variablesSchemaUri = monaco.editor.URI.file('/variables-schema.json');

const variablesModel = monaco.editor.createModel(
  '{}',
  'json',
  '/variables.json',
);

const variablesEditor = monaco.editor.create(
  document.getElementById('someElementId'),
  {
    model: variablesModel,
    language: 'graphql',
    formatOnPaste: true,
  },
);

// high-level method for configuring json variables validation
MonacoGraphQLAPI.setDiagnosticSettings({
  validateVariablesJson: {
    // Urls, uris, anything that monaco.URI.from() is compatible with.
    // Match operation model to variables editor,
    // and the language service will automatically listen for changes,
    // and compute the json schema using the GraphQLWorker.
    // This is in the main process is applied to the global monaco json settings
    // for validation, completion and more using monaco-json's built-in JSON Schema support.
    [operationModel.uri.toString()]: [variablesModel.uri.toString()],
  },
  jsonDiagnosticSettings: {
    allowComments: true, // allow json, parse with a jsonc parser to make requests
  },
});

MonacoGraphQL.setCompletionSettings({
  // this auto-fills NonNull leaf fields
  // it used to be on by default, but is annoying when
  // fields contain required argument.
  // hoping to fix that soon!
  __experimental__fillLeafsOnComplete: true,
});
```

You can also experiment with the built-in I think `jsonc`? (MSFT json5-ish
syntax, for `tsconfig.json` etc.) and the 3rd party `monaco-yaml` language modes
for completion of other types of variable input. you can also experiment with
editor methods to parse detected input into different formats, etc (`yaml`
pastes as `json`, etc.)

You could of course prefer to generate a `jsonschema` form for variables input
using a framework of your choice, instead of an editor. Enjoy!

## `MonacoGraphQLAPI` ([typedoc](https://graphiql-test.netlify.app/typedoc/classes/monaco_graphql.monacoMonacoGraphQLAPI.html))

If you call any of these API methods to modify the language service
configuration at any point at runtime, the webworker will reload relevant
language features.

If you `import 'monaco-graphql/monaco.contribution'` synchronously, you can access the api via
`monaco.languages.graphql.api`.

```ts
import 'monaco-graphql/monaco.contribution';
// now the api will be available on the `monaco.languages` global
const { api } = monaco.languages.graphql;
```

```ts
import 'monaco-graphql/monaco.contribution';

// also this
import { languages } from 'monaco-editor';
// now the api will be available on the `monaco.languages` global
const { api } = languages.graphql;
```

Otherwise, you can, like in the sync demo above:

```ts
import { initializeMode } from 'monaco-graphql';

const api = initializeMode(config);
```

### `monaco.languages.graphql.api.setSchemaConfig([SchemaConfig])`

same as the above, except it overwrites the entire schema config.

you can provide multiple, and use `fileMatch` to map to various uri "directory"
globs or specific files. `uri` can be an url or file path, anything parsable

```ts
// you can load it lazily
import 'monaco-graphql/monaco.contribution';

monaco.languages.graphql.api.setSchemaConfig([
  {
    schema: GraphQLSchema,
    fileMatch: ['**/*.graphql'],
    uri: 'my-schema.graphql',
  },
]);
```

or you can load the language features only when you have your schema

```ts
import { initializeMode } from 'monaco-graphql';

const schemas = [
  {
    schema: GraphQLSchema,
    fileMatch: ['operations/*.graphql'],
    uri: 'my-schema.graphql',
  },
];
const api = initializeMode({ schemas });

// add another schema. this will cause language workers and features to reset
api.setSchemaConfig([
  ...schemas,
  {
    introspectionJSON: myIntrospectionJSON,
    fileMatch: ['specific/monaco/uri.graphql'],
    uri: 'another-schema.graphql',
  },
]);
```

or if you want, replace the entire configuration with a single schema. this will
cause the worker to be entirely re-created and language services reset

```ts
api.setSchemaConfig([
  {
    introspectionJSON: myIntrospectionJSON,
    fileMatch: ['**/*.graphql'],
    uri: 'my-schema.graphql',
  },
]);
```

### `monaco.languages.graphql.api.setModeConfiguration()`

This is where you can toggle monaco language features. all are enabled by
default.

```ts
monaco.languages.graphql.api.setModeConfiguration({
  documentFormattingEdits: true,
  completionItems: true,
  hovers: true,
  documentSymbols: true,
  diagnostics: true,
});
```

### `monaco.languages.graphql.api.setFormattingOptions()`

this accepts an object `{ prettierConfig: prettier.Options }`, which accepts
[any prettier option](https://prettier.io/docs/en/options.html). it will not
re-load the schema or language features, however the new prettier options will
take effect.

this method overwrites the previous configuration, and will only accept static
values that can be passed between the main/worker process boundary.

```ts
monaco.languages.graphql.api.setFormattingOptions({
  // if you wanna be like that
  prettierOptions: { tabWidth: 2, useTabs: true },
});
```

### `monaco.languages.graphql.api.setExternalFragmentDefinitions()`

Append external fragments to be used by autocomplete and other language
features.

This accepts either a string that contains fragment definitions, or
`TypeDefinitionNode[]`

### `monaco.languages.graphql.api.getDiagnosticOptions`

```ts
monaco.languages.graphql.api.setDiagnosticSettings({
  validateVariablesJson: {
    // Urls, uris, anything that monaco.URI.from() is compatible with.
    // Match operation model to variables editor,
    // and the language service will automatically listen for changes,
    // and compute the json schema using the GraphQLWorker.
    // This is in the main process is applied to the global monaco json settings
    // for validation, completion and more using monaco-json's built-in JSON Schema support.
    [operationModel.uri.toString()]: [variablesModel.uri.toString()],
  },
  jsonDiagnosticSettings: {
    allowComments: true, // allow json, parse with a jsonc parser to make requests
  },
});
```

## Bundlers

### Webpack

you'll can refer to the webpack configuration in the
[full monaco webpack example](/examples/monaco-graphql-webpack#readme) to see
how it works with webpack and the official `monaco-editor-webpack-plugin`. there
is probably an easier way to configure webpack `worker-loader` for this.

### Vite

You can configure vite to load `monaco-editor` json mode and even the language
editor worker using
[the example for our mode](https://github.com/vdesjs/vite-plugin-monaco-editor#options)

## Web Frameworks

the plain javascript
[webpack example](https://github.com/graphql/graphiql/tree/main/examples/monaco-graphql-webpack)
should give you a starting point to see how to implement it with

### React

- [`use-monaco`](https://www.npmjs.com/package/use-monaco) seems to support the
  custom language worker configuration we want, and seems to be well built! we
  hope to help them build their
- when loading it yourself, either dynamic import the mode and/or instantiate it
  yourself using `useEffect` on `didMount` to prevent breaking SSR.
- it may work with other libraries by using a similar strategy to
  [this](https://github.com/graphql/graphiql/blob/9df315b44896efa313ed6744445fc8f9e702ebc3/examples/monaco-graphql-webpack/src/editors.ts#L15).
  you can also provide `MonacoEnvironment.getWorkerUrl` which works better as an
  async import of your pre-build worker files

## Custom Webworker (for passing non-static config to worker)

If you want to pass a custom parser and/or validation rules, it is supported,
however the setup is a bit more complicated.

You can add any `LanguageServiceConfig`
([typedoc](https://graphiql-test.netlify.app/typedoc/modules/graphql_language_service.html#graphqllanguageconfig-1))
configuration options you like here to `languageConfig` as below.

This is because we can't pass non-static configuration to the existing worker
programmatically, so you must import these and build the worker custom with
those functions. Part of the (worthwhile) cost of crossing runtimes!

you'll want to create your own `my-graphql.worker.ts` file, and add your custom
config such as `schemaLoader` to `createData`:

```ts
import type { worker as WorkerNamespace } from 'monaco-editor';
// @ts-expect-error - ignore missing types
import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';

import { GraphQLWorker } from 'monaco-graphql/GraphQLWorker';

import { myValidationRules } from './custom';

globalThis.onmessage = () => {
  worker.initialize(
    (
      ctx: WorkerNamespace.IWorkerContext,
      createData: monaco.languages.graphql.ICreateData,
    ) => {
      createData.languageConfig.customValidationRules = myValidationRules;
      return new GraphQLWorker(ctx, createData);
    },
  );
};
```

then, in your application:

```ts
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';

// specify the path to your language worker
import GraphQLWorker from 'worker-loader!./my-graphql.worker';

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    return label === 'graphql' ? new GraphQLWorker() : new EditorWorker();
  },
};
```

or, if you have webpack configured for it:

```ts
window.MonacoEnvironment = {
  getWorkerUrl(_workerId: string, label: string) {
    return label === 'graphql' ? 'my-graphql.worker.js' : 'editor.worker.js';
  },
};
```

with vite you just need:

```ts
import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    monacoEditorPlugin({
      customWorker: [
        {
          label: 'graphql',
          entry: 'my-graphql.worker.js',
        },
      ],
    }),
  ],
});
```

## Monaco Editor Tips

If you are familiar with Codemirror/Atom-era terminology and features, here's
some gotchas:

- "hinting" => "code completion" in LSP terminology
- "linting" => "diagnostics" in lsp terminology
- the default keymap is different, more vscode like
- command palette and right click context menu are important
- you can extend the provided standard completion, linting, etc. for example,
  `editor.setModelMarkers()`
- [Monaco Editor API Docs](https://microsoft.github.io/monaco-editor/api/index.html)
- [Monaco Editor Samples](https://github.com/Microsoft/monaco-editor-samples)
  repository is great for tips on implementing with different bundlers,
  runtimes, etc.

## Avoid Bundle All `monaco-editor`'s Languages

While importing `monaco-editor` in your project, you silently import 83 builtin
languages, such as `typescript`, `html`, `css`, `json` and others. You can found
a full list of
[basic-languages](https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages)
and
[languages](https://github.com/microsoft/monaco-editor/tree/main/src/language).

For `monaco-graphql`, you need only 2 languages - `graphql` and `json`.
In version `monaco-graphql@1.3.0` and later, you can replace all `monaco-editor`'s
imports with `monaco-graphql/monaco-editor` to improve performance, load
only `graphql` and `json` languages, and skip loading unused languages.

```diff
-import { ... } from 'monaco-editor'
+import { ... } from 'monaco-graphql/monaco-editor'
```

### Catch Future Import Mistakes with ESLint

To prevent mis-importing of `monaco-editor`, you can set up default
`no-restricted-imports` rule for JavaScript projects or
`@typescript-eslint/no-restricted-imports` for TypeScript projects.

```json5
{
  rules: {
    // or @typescript-eslint/no-restricted-imports
    'no-restricted-imports': [
      'error',
      {
        name: 'monaco-editor',
        message: '`monaco-editor` imports all languages; use `monaco-graphql/monaco-editor` instead to import only `json` and `graphql` languages',
      },
    ],
  },
}
```

## Inspiration

`microsoft/monaco-json` was our inspiration from the outset, when it was still a
standalone repository. @acao actually wholesale copied many files, you could
almost say it was a fork!

## TODO

- [x] variables JSON validation
- [x] variables completion
- [ ] Symbols & Definitions
- [x] file uri-driven schema loading
- [x] op -> schema & schema -> schema references
- [x] `insertText` for field and argument completion
