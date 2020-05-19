# graphql-language-service-cli

> Note: As of 3.0.0, this package has been renamed from `graphql-language-service` to `graphql-language-service-cli`. please now use the `graphql-lsp` bin, instead of the `graphql` binary.

[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)
![npm downloads](https://img.shields.io/npm/dm/graphql-language-service?label=npm%20downloads)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/codemirror-graphql)
[![License](https://img.shields.io/npm/l/graphql-language-service.svg?style=flat-square)](LICENSE)

_We welcome your feedback and suggestions._

GraphQL Language Service provides an interface for building GraphQL language services for IDEs.

Partial support for [Microsoft's Language Server Protocol](https://github.com/Microsoft/language-server-protocol) is in place, with more to come in the future.

Supported features include:

- Diagnostics (GraphQL syntax linting/validations) (**spec-compliant**)
- Autocomplete suggestions (**spec-compliant**)
- Hyperlink to fragment definitions and named types (type, input, enum) definitions (**spec-compliant**)
- Outline view support for queries

## Installation and Usage

### Dependencies

An LSP-compatible client with a file watcher that sends watch notifications to the server.

**DROPPED**: GraphQL Language Service no longer depends on [Watchman](https://facebook.github.io/watchman/)

### Installation

with `yarn`:

```
yarn global add graphql-language-service-cli
```

with `npm`:

```
npm i -g graphql-language-service-cli
```

### GraphQL configuration file (`.graphqlrc.yml`)

Check out [graphql-config](https://graphql-config.com/docs/introduction)

The graphql features we support are:

- `customDirectives` - `['@myExampleDirective']`
- `customValidationRules` - returns rules array with parameter `ValidationContext` from `graphql/validation`;

### Using the command-line interface

The node executable contains several commands: `server` and the command-line language service methods (`validate`, `autocomplete`, `outline`).

Improving this list is a work-in-progress.

```

GraphQL Language Service Command-Line Interface.

Usage: bin/graphql.js <command> <file>

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
