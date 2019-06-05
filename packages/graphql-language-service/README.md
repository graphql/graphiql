# GraphQL Language Service

[![Greenkeeper badge](https://badges.greenkeeper.io/graphql/graphql-language-service.svg)](https://greenkeeper.io/)

_This is currently in technical preview. We welcome your feedback and suggestions._

[![Build Status](https://travis-ci.org/graphql/graphql-language-service.svg?branch=master)](https://travis-ci.org/graphql/graphql-language-service)

GraphQL Language Service provides an interface for building GraphQL language services for IDEs.

Partial support for [Microsoft's Language Server Protocol](https://github.com/Microsoft/language-server-protocol) is in place, with more to come in the future.

Currently supported features include:
- Diagnostics (GraphQL syntax linting/validations) (**spec-compliant**)
- Autocomplete suggestions (**spec-compliant**)
- Hyperlink to fragment definitions and named types (type, input, enum) definitions (**spec-compliant**)
- Outline view support for queries


## Installation and Usage

### Dependencies

GraphQL Language Service depends on [Watchman](https://facebook.github.io/watchman/) running on your machine. Follow [this installation guide](https://facebook.github.io/watchman/docs/install.html) to install Watchman.

### Installation

```
git clone git@github.com:graphql/graphql-language-service.git
cd {path/to/your/repo}
npm install ../graphql-language-service
```

After pulling the latest changes from this repo, be sure to run `yarn run build` to transform the `src/` directory and generate the `dist/` directory.

The library includes a node executable file which you can find in `./node_modules/.bin/graphql.js` after installation.

### GraphQL configuration file (`.graphqlconfig`)

Check out [graphql-config](https://github.com/graphcool/graphql-config)

### Using the command-line interface

The node executable contains several commands: `server` and a command-line language service methods (`lint`, `autocomplete`, `outline`).

Improving this list is a work-in-progress.

```
GraphQL Language Service Command-Line Interface.
Usage: bin/graphql.js <command> <file>
    [-h | --help]
    [-c | --configDir] {configDir}
    [-t | --text] {textBuffer}
    [-f | --file] {filePath}
    [-s | --schema] {schemaPath}


Options:
  -h, --help        Show help                                          [boolean]
  -t, --text        Text buffer to perform GraphQL diagnostics on.
                    Will defer to --file option if omitted.
                    Overrides the --file option, if any.
                                                                        [string]
  -f, --file        File path to perform GraphQL diagnostics on.
                    Will be ignored if --text option is supplied.
                                                                        [string]
  --row             A row number from the cursor location for GraphQL
                    autocomplete suggestions.
                    If omitted, the last row number will be used.
                                                                        [number]
  --column          A column number from the cursor location for GraphQL
                    autocomplete suggestions.
                    If omitted, the last column number will be used.
                                                                        [number]
  -c, --configDir   Path to the .graphqlrc configuration file.
                    Walks up the directory tree from the provided config
                    directory, or the current working directory, until a
                    .graphqlrc is found or the root directory is found.
                                                                        [string]
  -s, --schemaPath  a path to schema DSL file
                                                                        [string]

At least one command is required.
Commands: "server, validate, autocomplete, outline"
```

## Architectural Overview

GraphQL Language Service currently communicates via Stream transport with the IDE server. GraphQL server will receive/send RPC messages to perform language service features, while caching the necessary GraphQL artifacts such as fragment definitions, GraphQL schemas etc. More about the server interface and RPC message format below.

The IDE server should launch a separate GraphQL server with its own child process for each `.graphqlconfig` file the IDE finds (using the nearest ancestor directory relative to the file currently being edited):
```
./application

  ./productA
    .graphqlconfig
    ProductAQuery.graphql
    ProductASchema.graphql

  ./productB
    .graphqlconfig
    ProductBQuery.graphql
    ProductBSchema.graphql
```
A separate GraphQL server should be instantiated for `ProductA` and `ProductB`, each with its own `.graphqlconfig` file, as illustrated in the directory structure above.

The IDE server should manage the lifecycle of the GraphQL server. Ideally, the IDE server should spawn a child process for each of the GraphQL Language Service processes necessary, and gracefully exit the processes as the IDE closes. In case of errors or a sudden halt the GraphQL Language Service will close as the stream from the IDE closes.

### Server Interface

GraphQL Language Server uses [JSON-RPC](http://www.jsonrpc.org/specification) to communicate with the IDE servers. Microsoft's language server currently supports two communication transports: Stream (stdio) and IPC. For IPC transport, the reference guide to be used for development is [the language server protocol](https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md) documentation.

For each transport, there is a slight difference in JSON message format, especially in how the methods to be invoked are defined - below are the currently supported methods for each transport (will be updated as progress is made):

|                     | Stream                       | IPC                               |
| -------------------:|------------------------------|-----------------------------------|
| Diagnostics         | `getDiagnostics`             | `textDocument/publishDiagnostics` |
| Autocompletion      | `getAutocompleteSuggestions` | `textDocument/completion`         |
| Outline             | `getOutline`                 | Not supported yet                 |
| Go-to definition    | `getDefinition`              | Not supported yet                 |
| File Events         | Not supported yet            | `didOpen/didClose/didSave/didChange` events |
