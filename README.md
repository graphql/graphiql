# VSCode GraphQL

GraphQL extension VSCode built with an aim to tightly integrate the [GraphQL Ecosystem](https://www.prisma.io/docs/graphql-ecosystem/) with VSCode for an awesome developer experience.

## Features

### General features

- Load the extension on detecting `graphql-config file` at root level or in a parent level directory
- Load the extension in `.graphql`, `.gql files`
- Load the extension on detecting `gql` tag in js, ts, jsx, tsx, vue files
- Support `graphql-config file` with one project and multiple projects

### `.graphql`, `.gql` file extension support

- syntax highlighting (type, query, mutation, interface, union, enum, scalar, fragments)
- autocomplete suggestions
- validation against schema
- snippets (interface, type, input, enum, union)
- hover support
- go to definition support (input, enum, type)

### `gql` tagged template literal support

- syntax highlighting (type, query, mutation, interface, union, enum, scalar, fragments)
- autocomplete suggestions
- validation against schema
- snippets

## Usage

Just install the [VSCode GraphQL Extension](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql). This extension adds syntax highlighting and IntelliSense for graphql files and `gql` tags.

To support language features like "go-to definition" across multiple files, please include `includes` key in the graphql-config per project. For example,

```
projects:
  app:
    schemaPath: src/schema.graphql
    includes: ["**/*.graphql"]
    extensions:
      endpoints:
        default: http://localhost:4000
  prisma:
    schemaPath: src/generated/prisma.graphql
    includes: ["**/*.graphql"]
    extensions:
      prisma: prisma/prisma.yml
      codegen:
      - generator: prisma-binding
        language: typescript
        output:
          binding: src/generated/prisma.ts
```

Notice that `includes` key supports glob pattern and hence
`[**/*.graphql]` is also valid.

If you want to use a [workspace version of TypeScript](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions) however, you must manually install the plugin along side the version of TypeScript in your workspace:

```bash
npm install --save-dev ts-graphql-plugin
```

Then add a `plugins` section to your [`tsconfig.json`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) or [`jsconfig.json`](https://code.visualstudio.com/Docs/languages/javascript#_javascript-project-jsconfigjson)

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-graphql-plugin"
      }
    ]
  }
}
```

Finally, run the `Select TypeScript version` command in VS Code to switch to use the workspace version of TypeScript for VS Code's JavaScript and TypeScript language support. You can find more information about managing typescript versions [in the VS Code documentation](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions).

## Development

Testing GraphQL Language Features

1.  Clone the repository - https://github.com/prismagraphql/vscode-graphql
1.  `npm install`
1.  Open it in VSCode
1.  Go to debugging section and run the launch program "Extension"
1.  This will open another VSCode instance with extension enabled - open a project with graphql config file - ":electric_plug: graphql" in VSCode status bar indicates that the extension is in use

Testing TypeScript GraphQL Plugin Features

1.  Go to `vscode-graphql/ts-graphql-plugin`
1.  `npm install` and `npm link`
1.  Use `npm link ts-graphql-plugin` in the folder that you have opened to test things in extension host - this is required for development
1.  Switch to use workspace typescript - [this is required for development](https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#testing-locally)

## License 

MIT
