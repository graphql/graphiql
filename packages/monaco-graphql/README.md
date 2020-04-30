# Monaco GraphQL

GraphQL language plugin for the Monaco Editor. It provides the following features while editing GraphQL files:

- Code completion\*
- Hover\*
- Validation\*
- Formatting - using prettier
- Syntax Highlighting
- Configurable schema loading

* GraphQL Schema Driven

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

## API

### `updateSchemaConfig()`

set schema uri (required) as well as `requestOptions`, `buildSchemaConfig` and `introspectionOptions`

```ts
monaco.languages.graphql.graphqlDefaults.updateSchemaConfig({
  uri: '',
});
```

### `set

you'll need to refer to the webpack configuration in the [full monaco webpack example](/examples/monaco-graphql-webpack#readme) for this example to work in webpack.
more examples coming soon

## Advanced Usage

If you want to pass a custom parser and/or schema fetching module, then that is supported, however the setup is a bit more complicated.

you'll want to create your own `graphql.worker.ts` file, and add your custom config such as `schemaLoader` to `createData`:

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

## TODO

- [ ] variables JSON validation
- [ ] variables completion
- [ ] Symbols & Definitions
- [ ] file uri-driven config/schema
- [ ] schema <-> operation references
