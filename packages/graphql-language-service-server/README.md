# graphql-language-service-server

[![NPM](https://img.shields.io/npm/v/graphql-language-service-server.svg?style=flat-square)](https://npmjs.com/graphql-language-service-server)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-server?label=npm%20downloads)
[![License](https://img.shields.io/npm/l/graphql-language-service-server.svg?style=flat-square)](LICENSE)

[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphql_language_service_server.html)

Server process backing the [GraphQL Language Service](https://github.com/graphql/graphiql/tree/main/packages/graphql-language-service).

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

```bash
npm install --save graphql-language-service-server
# or
yarn add graphql-language-service-server
```

We also provide a CLI interface to this server, see [`graphql-language-service-cli`](../graphql-language-service-cli/)

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

### GraphQL configuration file

You _must_ provide a graphql config file

Check out [graphql-config](https://graphql-config.com/introduction) to learn the many ways you can define your graphql config

#### `.graphqlrc` or `.graphqlrc.yml/yaml` or `graphql.config.yml`

```yaml
schema: 'packages/api/src/schema.graphql'
documents: 'packages/app/src/components/**/*.{tsx,ts}'
extensions:
  endpoints:
    example:
      url: 'http://localhost:8000'
  customExtension:
    foo: true
```

#### `.graphqlrc` or `.graphqlrc.json` or `graphql.config.json`

```json
{ "schema": "https://localhost:8000" }
```

#### `graphql.config.js` or `.graphqlrc.js`

```js
module.exports = { schema: 'https://localhost:8000' };
```

#### custom `startServer`

use graphql config [`loadConfig`](https://graphql-config.com/load-config) for further customization:

```ts
import { loadConfig } from 'graphql-config'; // 3.0.0 or later!

await startServer({
  method: 'node',
  // or instead of configName, an exact path (relative from rootDir or absolute)

  // deprecated for: loadConfigOptions.rootDir. root directory for graphql config file(s), or for relative resolution for exact `filePath`. default process.cwd()
  // configDir: '',
  loadConfigOptions: {
    // any of the options for graphql-config@3 `loadConfig()`

    // rootDir is same as `configDir` before, the path where the graphql config file would be found by cosmic-config
    rootDir: 'config/',
    // or - the relative or absolute path to your file
    filePath: 'exact/path/to/config.js (also supports yml, json)',
    // myPlatform.config.js/json/yaml works now!
    configName: 'myPlatform',
  },
});
```

The graphql-config features we support are:

```js
module.exports = {
  extensions: {
    // add customDirectives *legacy*. you can now provide multiple schema pointers to config.schema/project.schema, including inline strings
    "customDirectives": ["@myExampleDirective"],
     // a function that returns rules array with parameter `ValidationContext` from `graphql/validation`
    "customValidationRules": require('./config/customValidationRules')
    "languageService": {
      // should the language service read from source files? if false, it generates a schema from the project/config schema
      useSchemaFileDefinitions: false
    }
  }
}
```

we also load `require('dotenv').config()`, so you can use process.env variables from local `.env` files!

### Workspace Configuration

The LSP Server reads config by sending `workspace/configuration` method when it initializes.

| Parameter                                | Default                         | Description                                                                                            |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `graphql-config.load.baseDir`            | workspace root or process.cwd() | the path where graphql config looks for config files                                                   |
| `graphql-config.load.filePath`           | `null`                          | exact filepath of the config file.                                                                     |
| `graphql-config.load.configName`         | `graphql`                       | config name prefix instead of `graphql`                                                                |
| `graphql-config.load.legacy`             | `true`                          | backwards compatibility with `graphql-config@2`                                                        |
| `graphql-config.dotEnvPath`              | `null`                          | backwards compatibility with `graphql-config@2`                                                        |
| `vsode-graphql.useSchemaFileDefinitions` | `false`                         | whether the LSP server will use source files, or generate an SDL from `config.schema`/`project.schema` |

all the `graphql-config.load.*` configuration values come from static `loadConfig()` options in graphql config.

(more coming soon!)

### Architectural Overview

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

GraphQL Language Server uses [JSON-RPC](http://www.jsonrpc.org/specification) to communicate with the IDE servers. Microsoft's language server currently supports two communication transports: Stream (stdio) and IPC. For IPC transport, the reference guide to be used for development is [the language server protocol](https://microsoft.github.io/language-server-protocol/specification) documentation.

For each transport, there is a slight difference in JSON message format, especially in how the methods to be invoked are defined - below are the currently supported methods for each transport (will be updated as progress is made):

|                      | Stream                       | IPC                                         |
| -------------------: | ---------------------------- | ------------------------------------------- |
|          Diagnostics | `getDiagnostics`             | `textDocument/publishDiagnostics`           |
|       Autocompletion | `getAutocompleteSuggestions` | `textDocument/completion`                   |
|              Outline | `getOutline`                 | `textDocument/outline`                      |
|     Document Symbols | `getDocumentSymbols`         | `textDocument/symbols`                      |
|    Workspace Symbols | `getWorkspaceSymbols`        | `workspace/symbols`                         |
|     Go-to definition | `getDefinition`              | `textDocument/definition`                   |
| Workspace Definition | `getWorkspaceDefinition`     | `workspace/definition`                      |
|          File Events | Not supported yet            | `didOpen/didClose/didSave/didChange` events |
