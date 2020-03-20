# graphql-language-service-server

[![NPM](https://img.shields.io/npm/v/graphql-language-service-server.svg?style=flat-square)](https://npmjs.com/graphql-language-service-server)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-server?label=npm%20downloads)
[![License](https://img.shields.io/npm/l/graphql-language-service-server.svg?style=flat-square)](LICENSE)

Server process backing the [GraphQL Language Service](https://github.com/graphql/graphiql/tree/master/packages/graphql-language-service).

GraphQL Language Service Server provides an interface for building GraphQL language services for IDEs.

Partial support for [Microsoft's Language Server Protocol](https://github.com/Microsoft/language-server-protocol) is in place, with more to come in the future.

Supported features include:

- Diagnostics (GraphQL syntax linting/validations) (**spec-compliant**)
- Autocomplete suggestions (**spec-compliant**)
- Hyperlink to fragment definitions and named types (type, input, enum) definitions (**spec-compliant**)
- Outline view support for queries
- Support for `gql` `graphql` and other template tags inside javascript, typescript, jsx and tsx files, and an interface to allow custom parsing of all files.

## Installation and Usage

### Dependencies

An LSP compatible client with it's own file watcher, that sends watch notifications to the server.

**DROPPED**: GraphQL Language Service no longer depends on [Watchman](https://facebook.github.io/watchman/)

### Installation

```
git clone git@github.com:graphql/graphql-language-servic-server.git
cd {path/to/your/repo}
npm install ../graphql-language-service-server
```

After pulling the latest changes from this repo, be sure to run `yarn run build` to transform the `src/` directory and generate the `dist/` directory.

The library includes a node executable file which you can find in `./node_modules/.bin/graphql.js` after installation.

### GraphQL configuration file (`.graphqlrc.yml`)

Check out [graphql-config](https://graphql-config.com/docs/introduction)

#### `.graphqlrc` or `.graphqlrc.yml/yaml`

```yaml
schema: 'packages/api/src/schema.graphql'
documents: 'packages/app/src/components/**/*.graphql'
extensions:
  customExtension:
    foo: true
```

#### `.graphqlrc` or `.graphqlrc.json`

```json
{ "schema": "https://localhost:8000" }
```

#### `graphql.config.js` or `.graphqlrc.js`

```js
module.exports = { schema: 'https://localhost:8000' };
```

#### custom `loadConfig`

use graphql config [`loadConfig`](https://graphql-config.com/docs/load-config) for further customization:

```ts
import { loadConfig } from 'graphql-config'; // 3.0.0 or later!

await startServer({
  method: 'node',
  config: loadConfig({
     // myPlatform.config.js works now!
    configName: 'myPlatform',
    // or instead of configName, an exact path (relative from rootDir or absolute)
    filePath: 'exact/path/to/config.js (also supports yml, json)'
     // rootDir to look for config file(s), or for relative resolution for exact `filePath`. default process.cwd()
    rootDir: '',
  })
});
```

The graphql features we support are:

- `customDirectives` - `['@myExampleDirective']`
- `customValidationRules` - returns rules array with parameter `ValidationContext` from `graphql/validation`;

### Usage

Initialize the GraphQL Language Server with the `startServer` function:

```ts
import { startServer } from 'graphql-language-service-server';

await startServer({
  method: 'node',
});
```

If you are developing a service or extension, this is the LSP language server you want to run.

When developing vscode extensions, just the above is enough to get started for your extension's `ServerOptions.run.module`, for example.

`startServer` function takes the following parameters:

| Parameter      | Required                                             | Description                                                                       |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| port           | `true` when method is `socket`, `false` otherwise    | port for the LSP server to run on                                                 |
| method         | `false`                                              | `socket`, `streams`, or `node` (ipc)                                              |
| config         | `false`                                              | custom `graphql-config` instance from `loadConfig` (see example above)            |
| configDir      | `false`                                              | the directory where graphql-config is found                                       |
| extensions     | `false`                                              | array of functions to transform the graphql-config and add extensions dynamically |
| parser         | `false`                                              | Customize _all_ file parsing by overriding the default `parseDocument` function   |
| fileExtensions | `false`. defaults to `['.js', '.ts', '.tsx, '.jsx']` | Customize file extensions used by the default LSP parser                          |

## Architectural Overview

GraphQL Language Service currently communicates via Stream transport with the IDE server. GraphQL server will receive/send RPC messages to perform language service features, while caching the necessary GraphQL artifacts such as fragment definitions, GraphQL schemas etc. More about the server interface and RPC message format below.

The IDE server should launch a separate GraphQL server with its own child process for each `.graphqlrc.yml` file the IDE finds (using the nearest ancestor directory relative to the file currently being edited):

```
./application

  ./productA
    .graphqlrc.yml
    ProductAQuery.graphql
    ProductASchema.graphql

  ./productB
    .graphqlrc.yml
    ProductBQuery.graphql
    ProductBSchema.graphql
```

A separate GraphQL server should be instantiated for `ProductA` and `ProductB`, each with its own `.graphqlrc.yml` file, as illustrated in the directory structure above.

The IDE server should manage the lifecycle of the GraphQL server. Ideally, the IDE server should spawn a child process for each of the GraphQL Language Service processes necessary, and gracefully exit the processes as the IDE closes. In case of errors or a sudden halt the GraphQL Language Service will close as the stream from the IDE closes.

### Server Interface

GraphQL Language Server uses [JSON-RPC](http://www.jsonrpc.org/specification) to communicate with the IDE servers. Microsoft's language server currently supports two communication transports: Stream (stdio) and IPC. For IPC transport, the reference guide to be used for development is [the language server protocol](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md) documentation.

For each transport, there is a slight difference in JSON message format, especially in how the methods to be invoked are defined - below are the currently supported methods for each transport (will be updated as progress is made):

|                  | Stream                       | IPC                                         |
| ---------------: | ---------------------------- | ------------------------------------------- |
|      Diagnostics | `getDiagnostics`             | `textDocument/publishDiagnostics`           |
|   Autocompletion | `getAutocompleteSuggestions` | `textDocument/completion`                   |
|          Outline | `getOutline`                 | `textDocument/outline`                      |
| Document Symbols | `getDocumentSymbols`         | `textDocument/symbols`                      |
| Go-to definition | `getDefinition`              | `textDocument/definition`                   |
|      File Events | Not supported yet            | `didOpen/didClose/didSave/didChange` events |
