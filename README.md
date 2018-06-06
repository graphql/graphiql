# VSCode GraphQL

GraphQL extension VSCode built with an aim to tightly integrate the [GraphQL Ecosystem](https://www.prisma.io/docs/graphql-ecosystem/) with VSCode for an awesome developer experience.

## Development

Testing GraphQL Language Features

1.  Clone the repository - https://github.com/prismagraphql/vscode-graphql
1.  `npm install`
1.  Open it in VSCode
1.  Go to debugging section and run the launch program "Extension"
1.  This will open another VSCode instance with extension enabled - open a project with graphql config file - ":electric_plug: grapqhl" in VSCode status bar indicates that the extension is in use

Testing TypeScript GraphQL Plugin Features

1.  Go to `vscode-graphql/ts-graphql-plugin`
1.  `npm link`
1.  Use `npm link ts-graphql-plugin` in the folder that you have opened to test things in extension host - this is required for development
1.  Switch to use workspace typescript - [this is required for development](https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#testing-locally)

## Features

### General features

- Load the extension on detecting `graphql-config file` at root level or in a parent level directory
- Load the extension in `.graphql`, `.gql files`
- Load the extension on detecting `gql` tag in js, ts, jsx, tsx, vue files
- Support `graphql-config file` with one project and multiple projects
- Test coverage
- Dev setup README

### `.graphql`, `.gql` file extension support

- syntax highlighting (type, query, mutation, interface, union, enum, scalar, fragments)
- autocomplete suggestions
- validation against schema (partial - prisma directives left)
- snippets (interface, type, input, enum, union)
- hover support
- go to definition support

### `gql` tagged template literal support

- syntax highlighting (type, query, mutation, interface, union, enum, scalar, )
- autocomplete suggestions (partial, no support for template literal variables)
- validation against schema
- sippets
