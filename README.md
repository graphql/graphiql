# VSCode GraphQL

GraphQL extension VSCode built with the aim to tightly integrate the GraphQL Ecosystem with VSCode for an awesome developer experience.

![](https://camo.githubusercontent.com/97dc1080d5e6883c4eec3eaa6b7d0f29802e6b4b/687474703a2f2f672e7265636f726469742e636f2f497379504655484e5a342e676966)

> 🆕 **New Insiders Extenion in Testing!:** We have a 0.3.0 version in development! Many bugs fixed, and new features. See our instructions for setting it up and helping us test it [here](https://github.com/prisma-labs/vscode-graphql/issues/181)
> 💡 **Note:** This extension no longer supports `.prisma` files. If you are using this extension with Prisma 1, please rename your datamodel from `datamodel.prisma` to `datamodel.graphql` and this extension will pick that up.

## Features

### General features

- Load the extension on detecting `graphql-config file` at root level or in a parent level directory
- Load the extension in `.graphql`, `.gql files`
- Load the extension on detecting `gql` tag in js, ts, jsx, tsx, vue files
- execute query/mutation/subscription operation, embedded or in graphql files
- pre-load schema and document defintitions
- Support [`graphql-config`](https://graphql-config.com/) files with one project and multiple projects

### `.graphql`, `.gql` file extension support

- syntax highlighting (type, query, mutation, interface, union, enum, scalar, fragments, directives)
- autocomplete suggestions
- validation against schema
- snippets (interface, type, input, enum, union)
- hover support
- go to definition support (input, enum, type)
- outline support

### `gql`/`graphql` tagged template literal support for tsx, jsx, ts, js

- syntax highlighting (type, query, mutation, interface, union, enum, scalar, fragments, directives)
- autocomplete suggestions
- validation against schema
- snippets
- hover support
- go to definition for fragments and input types
- outline support

## Usage

Install the [VSCode GraphQL Extension](https://marketplace.visualstudio.com/items?itemName=Prisma.vscode-graphql).

(Watchman is no longer required, you can uninstall it now)

**This extension requires a graphql-config file**.

As of `vscode-graphql@0.3.0` we support `graphql-config@3`. You can read more about that [here](https://graphql-config.com/usage). Because it now uses `cosmicconfig` there are plenty of new options for loading config files:

```
graphql.config.json
graphql.config.js
graphql.config.yaml
graphql.config.yml
.graphqlrc (YAML or JSON)
.graphqlrc.json
.graphqlrc.yaml
.graphqlrc.yml
.graphqlrc.js
graphql property in package.json
```

Previous versions of this extension support `graphql-config@2` format, which follows [legacy configuration patterns](https://github.com/kamilkisiela/graphql-config/tree/legacy#usage)

To support language features like "go-to definition" across multiple files, please include `documents` key in the graphql-config default or /per project (this was `includes` in 2.0). For example,

```js
// graphql.config.js
module.exports = {
  schema: ["src/schema.graphql", "my/directives.graphql"],
  documents: ["**/*.{graphql,js,ts,jsx,tsx}", "my/fragments.graphql"],
  extensions: {
    endpoints: {
      default: {
        url: "http://localhost:8000",
        headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
      },
    },
  },
  projects: {
    db: {
      schema: "src/generated/db.graphql",
      documents: ["src/db/**/*.graphql", "my/fragments.graphql"],
      extensions: {
        codegen: [
          {
            generator: "graphql-binding",
            language: "typescript",
            output: {
              binding: "src/generated/db.ts",
            },
          },
        ],
      },
    },
  },
}
```

Notice that `documents` key supports glob pattern and hence `["**/*.graphql"]` is also valid.

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

This plugin uses the [GraphQL language server](https://github.com/graphql/graphql-language-service-server)

1.  Clone the repository - https://github.com/prisma-labs/vscode-graphql
1.  `npm install`
1.  Open it in VSCode
1.  Go to the debugging section and run the launch program "Extension"
1.  This will open another VSCode instance with extension enabled
1.  Open a project with a graphql config file - ":electric_plug: graphql" in VSCode status bar indicates that the extension is in use
1.  Logs for GraphQL language service will appear in output section under GraphQL Language Service
    ![GraphQL Language Service Logging](https://s3-ap-southeast-1.amazonaws.com/divyendusingh/vscode-graphql/Screen+Shot+2018-06-25+at+12.31.57+PM.png)

## License

MIT
