# VSCode GraphQL

💡**Note:** This extension no longer supports `.prisma` files. If you are using this extension with Prisma 1, please rename your datamodel from `datamodel.prisma` to `datamodel.graphql` and this extension would pick that up.

GraphQL extension VSCode built with the aim to tightly integrate the [GraphQL Ecosystem](https://www.prisma.io/docs/graphql-ecosystem/) with VSCode for an awesome developer experience.

![](https://camo.githubusercontent.com/97dc1080d5e6883c4eec3eaa6b7d0f29802e6b4b/687474703a2f2f672e7265636f726469742e636f2f497379504655484e5a342e676966)

## Features

### General features

- Load the extension on detecting `graphql-config file` at root level or in a parent level directory
- Load the extension in `.graphql`, `.gql files`
- Load the extension on detecting `gql` tag in js, ts, jsx, tsx, vue files
- Support [`graphql-config`](https://github.com/prismagraphql/graphql-config) files with one project and multiple projects

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

1. [Install watchman](https://facebook.github.io/watchman/docs/install.html).
2. Install the [VSCode GraphQL Extension](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql).

**This extension requires a valid `.graphqlconfig` or `.graphqlconfig.yml` file in the project root.** You can read more about that [here](https://github.com/prismagraphql/graphql-config).

To support language features like "go-to definition" across multiple files, please include `includes` key in the graphql-config per project. For example,

```yaml
projects:
  app:
    schemaPath: src/schema.graphql
    includes: ["**/*.graphql"]
    extensions:
      endpoints:
        default: http://localhost:4000
  db:
    schemaPath: src/generated/db.graphql
    includes: ["**/*.graphql"]
    extensions:
      codegen:
        - generator: graphql-binding
          language: typescript
          output:
            binding: src/generated/db.ts
```

Notice that `includes` key supports glob pattern and hence
`["**/*.graphql"]` is also valid.

If you want to use a [workspace version of TypeScript](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions) however, you must manually install the plugin along side the version of TypeScript in your workspace:

```bash
npm install --save-dev @divyenduz/ts-graphql-plugin
```

Then add a `plugins` section to your [`tsconfig.json`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) or [`jsconfig.json`](https://code.visualstudio.com/Docs/languages/javascript#_javascript-project-jsconfigjson)

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@divyenduz/ts-graphql-plugin"
      }
    ]
  }
}
```

Finally, run the `Select TypeScript version` command in VS Code to switch to use the workspace version of TypeScript for VS Code's JavaScript and TypeScript language support. You can find more information about managing typescript versions [in the VS Code documentation](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions).

## Development

This plugin uses two language services based on the context.

1.  [GraphQL language service](https://github.com/graphql/graphql-language-service) when in `.graphql`, `.gql` files
1.  Augmentation of [GraphQL language service in TypeScript](https://github.com/divyenduz/ts-graphql-plugin) language service when using `gql` tag in `.ts`/`.js`/`.tsx`/`.jsx` files based on [this documentation](https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin).

Setup and logging for development are different for these language services as documented below.

### A. Testing/logging GraphQL Language Features

1.  Clone the repository - https://github.com/prismagraphql/vscode-graphql
1.  `npm install`
1.  Open it in VSCode
1.  Go to the debugging section and run the launch program "Extension"
1.  This will open another VSCode instance with extension enabled
1.  Open a project with a graphql config file - ":electric_plug: graphql" in VSCode status bar indicates that the extension is in use
1.  Logs for GraphQL language service will appear in output section under GraphQL Language Service
    ![GraphQL Language Service Logging](https://s3-ap-southeast-1.amazonaws.com/divyendusingh/vscode-graphql/Screen+Shot+2018-06-25+at+12.31.57+PM.png)

### B. Testing/logging TypeScript GraphQL Plugin Features

1.  Clone [ts-graphql-plugin](https://github.com/divyenduz/ts-graphql-plugin) and go to its directory.
1.  `npm install` and `npm link`
1.  Use `npm link @divyenduz/ts-graphql-plugin` in the folder that you have opened to test things in extension host - this is required for development
1.  Switch to use workspace typescript - [this is required for development](https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#testing-locally)
1.  To see the logs of TypeScript language service, instructions are [documented here](https://github.com/Microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#debugging). We need to set `TSS_LOG` environment variable to log to a file (see below) and then open VSCode through command line for it to pick up the `TSS_LOG` exported variable and then we can tail the file.

```
export TSS_LOG="-logToFile true -file <absolute-path> -level verbose"
cd <graphql-project-path>
code .
tail -f <absolute-path> | grep ts-graphql-plugin-log
```

## License

MIT

