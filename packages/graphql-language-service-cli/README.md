# graphql-language-service-cli

> Note: As of 3.0.0, this package has been renamed from `graphql-language-service` to `graphql-language-service-cli`. please now use the `graphql-lsp` bin, instead of the `graphql` binary.

[![NPM](https://img.shields.io/npm/v/graphql-language-service-cli.svg)](https://npmjs.com/graphql-language-service-cli)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service-vli?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)
[![License](https://img.shields.io/npm/l/graphql-language-service.svg?style=flat-square)](LICENSE)

_We welcome your feedback and suggestions._

GraphQL Language Service provides an interface for building GraphQL language services for IDEs.

Almost 100% for [Microsoft's Language Server Protocol](https://github.com/Microsoft/language-server-protocol) is in place

Supported features include:

- Diagnostics (GraphQL syntax linting/validations) (**spec-compliant**)
- Autocomplete suggestions (**spec-compliant**)
- Hyperlink to fragment definitions and named types (type, input, enum) definitions (**spec-compliant**)
- Outline view support for queries and SDL
- Symbols support across the workspace

see more information at [`graphql-language-service-server`](https://npmjs.com/graphql-language-service-server)

## Installation and Usage

### Dependencies

An LSP-compatible client with a file watcher that sends watch notifications to the server.

**DROPPED**: GraphQL Language Service no longer depends on [Watchman](https://facebook.github.io/watchman/)

Only node 9 or greater, and npm or yarn are required dependencies.

### Installation

with `yarn`:

```sh
yarn global add graphql-language-service-cli
```

with `npm`:

```sh
npm i -g graphql-language-service-cli
```

either will install the `graphql-lsp` bin globally

### GraphQL configuration file (`.graphqlrc.yml`)

Check out [graphql-config](https://graphql-config.com/introduction)

The custom graphql language configurations are:

- `customDirectives` - `['@myExampleDirective']`
- `customValidationRules` - returns rules array with parameter `ValidationContext` from `graphql/validation`

### Using the command-line interface

`graphql-lsp server --schema=localhost:3000`

The node executable contains several commands: `server` and the command-line language service methods (`validate`, `autocomplete`, `outline`).

```text
GraphQL Language Service Command-Line Interface.

Usage: graphql-lsp <command> <file>

[-h | --help][-c | --configdir] {configDir}
[-t | --text] {textBuffer}
[-f | --file] {filePath}
[-s | --schema] {schemaPath}

Options:

-h, --help Show help [boolean]

-t, --text Text buffer to perform GraphQL diagnostics on.
Will defer to --file option if omitted.
Overrides the --file option, if any.
[string]

-f, --file File path to perform GraphQL diagnostics on.
Will be ignored if --text option is supplied.
[string]

--row A row number from the cursor location for GraphQL
autocomplete suggestions.
If omitted, the last row number will be used.
[number]

--column A column number from the cursor location for GraphQL
autocomplete suggestions.
If omitted, the last column number will be used.
[number]

-c, --configDir Path to the .graphqlrc.yml configuration file.
Walks up the directory tree from the provided config
directory, or the current working directory, until a
.graphqlrc is found or the root directory is found.
[string]

-s, --schemaPath a path to schema DSL file
[string]

At least one command is required.
Commands: "server, validate, autocomplete, outline"

```
