# GraphQL Language Service

_This is currently in technical preview. We welcome your feedback and suggestions._

GraphQL Language Service provides an interface for building GraphQL Language Service for IDEs. Currently supported features include:
- Diagnostics (GraphQL syntax linting/validations)
- Autocomplete suggestions
- Hyperlink to fragment definitions
- Outline view support for queries


## Installation and Usage

### Dependencies

GraphQL Language Service depends on [Watchman](https://facebook.github.io/watchman/) service running on your machine. Follow [this installation guide](https://facebook.github.io/watchman/docs.install.html) to install the service.

### Installation

```
git clone git@github.com:graphql/graphql-language-service.git
cd {path/to/your/repo}
npm install ../graphql-language-service
```

After pulling the latest changes from this repo, be sure to run `npm run build` to transform the `src/` directory and generate the `dist/` directory.

The library includes a node executable file in `./node_modules/.bin/graphql.js` after installation.

### GraphQL configuration file (`.graphqlrc`)

GraphQL Language Service, to serve its full potential, will need to know some information about your GraphQL development environment. `.graphqlrc` is a GraphQL configuration file that contains this information.
```
{
  "build-configs": {
    "product-name": {
      "input-dirs": [
        "/dir/paths/to/your/graphql/files"
      ],
      "exclude-dirs": [
        "/dir/paths/to/ignore/"
      ],
      "schema-path": "/path/to/the/schema/" // supports `.graphql` IDL or `.json` file
    }
  }
}
```
`.graphqlrc` can define mutliple configurations for each GraphQL environment, should you have more than one.

The GraphQL configurations will be used to perform two things in a nutshell:

1. Using `input-dirs` and `exclude-dirs`, cache all fragment definitions per each product. This information will be used to compute interdependencies between GraphQL queries and fragments.
2. Using `schema-path`, build and cache `GraphQLSchema`s (per product). The schema will be used to perform query validations, autocomplete suggestions etc.

Also, if GraphQL server receives a RPC message that contains the path of the file being performed of a language service feature, `input-dirs` and `exclude-dirs` are used to determine which product configuration the file is associated with. Refer to [GraphQLConfig class](https://github.com/graphql/graphql-language-service/blob/master/src/config/GraphQLConfig.js#L80) for more information.

### Using the command-line interface

The node executable contains several commands: `server` and a command-line language service methods (`lint`, `autocomplete`, `outline`).

WIP to improve this list.

```
Usage: graphql <command>

    [-h | --help]
    [-c | --config] {configPath}
    [-t | --text] {textBuffer}
    [-f | --file] {filePath}
    [-s | --schema] {schemaPath}

Options:
  -h, --help    Show help                                              [boolean]
  -c, --config  GraphQL Config file path (.graphqlrc).
                Will look for the nearest .graphqlrc file if omitted.
                                                                        [string]
  -t, --text    Text buffer to perform GraphQL lint on.
                Will defer to --file option if omitted.
                This option is always honored over --file option.
                                                                        [string]
  -f, --file    File path to perform GraphQL lint on.
                Will be ignored if --text option is supplied.
                                                                        [string]
  -s, --schema  a path to schema DSL file
                                                                        [string]

At least one command is required.
Commands: "server, lint, autocomplete, outline"
```

## Architectural Overview

GraphQL Language Service currently communicates via Stream transport with the IDE server. GraphQL server will receive/send RPC messages to perform language service features, while caching the necessary GraphQL artifacts such as fragment definitions, GraphQL schemas etc. More about the server interface and RPC message format below.

The IDE server should launch a separate GraphQL server with its own child process for each `.graphqlrc` file the IDE finds (using the nearest ancestor directory relative to the file currently being edited):
```
./application

  ./productA
    .graphqlrc
    ProductAQuery.graphql
    ProductASchema.graphql

  ./productB
    .graphqlrc
    ProductBQuery.graphql
    ProductBSchema.graphql
```
A separate GraphQL server should be instantiated for `ProductA` and `ProductB`, each with its own `.graphqlrc` file, as illustrated in the directory structure above.

The IDE server should manage the lifecycle of the GraphQL server. Ideally, the IDE server should spawn a child process for each of the GraphQL servers necessary, and gracefully exit the GraphQL server as the IDE closes. In case of errors/sudden halt the GraphQL server will close as the stream from the IDE closes.

### Server Interface

The server sends/receives RPC messages to/from the IDE server to perform language service features. The details for the RPC message format are described below:

```
/**
 * The JSON message sent from the IDE server should have the following structure:
 * {
 *    protocol: 'graphql-protocol',
 *    id: number,
 *    method: string, // one of the function names below, e.g. `getDiagnostics`
 *    args: {
 *      query?: string,
 *      position?: Point,
 *      filePath?: Uri,
 *    }
 * }
 */
// Diagnostics (lint/validation)
export type GraphQLDiagnosticMessage = {
  name: string,
  type: string,
  text: string,
  range: atom$Range,
  filePath: string,
};

export function getDiagnostics(
  query: string,
  filePath: Uri,
) : Promise<Array<GraphQLDiagnosticMessage>> {
  throw new Error('RPC stub');
}

// Autocomplete  Suggestions (typeahead)
export type GraphQLAutocompleteSuggestionType = {
  text: string,
  typeName: ?string,
  description: ?string,
};

export function getAutocompleteSuggestions(
  query: string,
  position: atom$Point,
  filePath: Uri,
) : Promise<Array<GraphQLAutocompleteSuggestionType>> {
  throw new Error('RPC stub');
}

// Definitions (hyperlink)
export type Definition = {
  path: Uri,
  position: Point,
  range?: Range,
  id?: string,
  name?: string,
  language: string,
  projectRoot?: Uri,
};

export type DefinitionQueryResult = {
  queryRange: Array<Range>,
  definitions: Array<Definition>,
};

export function getDefinition(
  query: string,
  position: atom$Point,
  filePath: Uri,
): Promise<DefinitionQueryResult> {
  throw new Error('RPC stub');
}

// Outline view
export function getOutline(query: string): Promise<Outline> {
  throw new Error('RPC stub');
}

// Disconnect signal - gracefully terminate the connection on IDE exit
export function disconnect(): void {
  throw new Error('RPC stub');
}
```
