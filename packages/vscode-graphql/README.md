[Changelog](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql/CHANGELOG.md)
| [Discord Channel](https://discord.gg/r4BxrAG6fN) |
[LSP Server Docs](https://github.com/graphql/graphiql/blob/main/packages/graphql-language-service-server/README.md)

GraphQL extension for VSCode built with the aim to tightly integrate the GraphQL
Ecosystem with VSCode for an awesome developer experience.

![](https://camo.githubusercontent.com/97dc1080d5e6883c4eec3eaa6b7d0f29802e6b4b/687474703a2f2f672e7265636f726469742e636f2f497379504655484e5a342e676966)

### `.graphql`, `.gql` file extension support and `gql`/`graphql` tagged template literal support for tsx, jsx, ts, js

- syntax highlighting (provided by `vscode-graphql-syntax`)
- autocomplete suggestions
- validation against schema
- snippets (interface, type, input, enum, union)
- hover support
- go to definition support (input, enum, type)
- outline support

## Getting Started

> **This extension requires a graphql-config file**.

To support language features like completion and "go-to definition" across multiple files,
please include `documents` in the `graphql-config` file default or per-project

### Simplest Config Example

```yaml
# .graphqlrc.yml or graphql.config.yml
schema: 'schema.graphql'
documents: 'src/**/*.{graphql,js,ts,jsx,tsx}'
```

`package.json`:

```json
"graphql": {
  "schema": "https://localhost:3001/graphql",
  "documents": "**/*.{graphql,js,ts,jsx,tsx}"
},
```

```ts
// .graphqlrc.ts or graphql.config.ts
export default {
  schema: 'schema.graphql',
  documents: '**/*.{graphql,js,ts,jsx,tsx}',
};
```

same for .json, .toml, etc

## Additional Features

- Loads the LSP server upon detecting a `graphql-config` file at root level or in a
  parent level directory, or a `package.json` file with `graphql` config
- Loads `.graphql`, `.gql` files, and detects `gql`, `graphql` tags and `/** GraphQL */` and `#graphql` comments in js, ts, jsx, tsx, vue files
- pre-load schema and fragment definitions
- Support [`graphql-config`](https://graphql-config.com/) files with one or multiple projects (multi-root workspaces are not yet supported)
- the language service re-starts on saved changes to vscode settings and/or graphql config!

## Configuration

| Parameter                                 | Default                                           | Description                                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `graphql-config.load.baseDir`             | workspace root or process.cwd()                   | the path where graphql config looks for config files                                                                                                                                                                                                                                                |
| `graphql-config.load.filePath`            | `null`                                            | exact filepath of the config file.                                                                                                                                                                                                                                                                  |
| `graphql-config.load.configName`          | `graphql`                                         | config name prefix instead of `graphql`                                                                                                                                                                                                                                                             |
| `graphql-config.load.legacy`              | `true`                                            | backwards compatibility with `graphql-config@2`                                                                                                                                                                                                                                                     |
| `graphql-config.dotEnvPath`               | `null`                                            | backwards compatibility with `graphql-config@2`                                                                                                                                                                                                                                                     |
| `vscode-graphql.cacheSchemaFileForLookup` | `true` if `schema` contains non-sdl files or urls | generate an SDL file based on your graphql-config schema configuration for definition lookup and other features. enabled by default when your `schema` config are urls or introspection json, or if you have any non-local SDL files in `schema`                                                    |
| `vscode-graphql.schemaCacheTTL`           | `30000`                                           | an integer value in milleseconds for the desired minimum cache lifetime for all schemas, which also causes the generated file to be re-written. set to 30s by default. effectively a "lazy" form of polling. if you are developing a schema alongside client queries, you may want to decrease this |
| `vscode-graphql.debug`                    | `false`                                           | show more verbose log output in the output channel                                                                                                                                                                                                                                                  |

### Advanced Example

Multi-project can be used for both local files, URL defined schema, or both

```ts
import dotenv from 'dotenv';
dotenv.config();

// .graphqlrc.ts or graphql.config.ts
export default {
  projects: {
    app: {
      schema: ['src/schema.graphql', 'directives.graphql'],
      documents: ['**/*.{graphql,js,ts,jsx,tsx}', 'my/fragments.graphql'],
    },
    db: {
      schema: 'src/generated/db.graphql',
      documents: ['src/db/**/*.graphql', 'my/fragments.graphql'],
      extensions: {
        endpoints: {
          default: {
            url: 'https://localhost:3001/graphql/',
            headers: {
              Authorization: `Bearer ${process.env.API_TOKEN}`,
            },
          },
        },
      },
    },
  },
};
```

Notice that `documents` key supports glob pattern and hence `["**/*.graphql"]`
is also valid.

## Frequently Asked Questions

### The extension fails with errors about duplicate types

Your object types must be unique per project (as they must be unique per schema), and your fragment names must also be unique per project.

### The extension fails with errors about missing scalars, directives, etc

Make sure that your `schema` pointers refer to a complete schema!

### In JSX and TSX files I see completion items I don't need

The way vscode lets you filter these out is
[on the user end](https://github.com/microsoft/vscode/issues/45039)

So you'll need to add something like this to your global vscode settings:

```json
"[typescriptreact]": {
  "editor.suggest.filteredTypes": {
    "snippet": false
  }
},
"[javascriptreact]": {
  "editor.suggest.filteredTypes": {
    "snippet": false
  }
}
```

### My graphql config file is not at the root

Good news, we have configs for this now!

You can search a folder for any of the matching config file names listed above:

```json
"graphql-config.load.rootDir": "./config"
"graphql-config.envFilePath": "./config/.dev.env"
```

Or a specific filepath:

```json
"graphql-config.load.filePath": "./config/my-graphql-config.js"
```

Or a different `configName` that allows different formats:

```json
"graphql-config.load.rootDir": "./config",
"graphql-config.load.configName": "acme"
```

which would search for `./config/.acmerc`, `.config/.acmerc.js`,
`.config/acme.config.json`, etc matching the config paths above

If you have multiple projects, you need to define one top-level config that
defines all project configs using `projects`

### How do I enable language features for an embedded graphql string?

Please refer to the `vscode-graphql-syntax` reference files ([js](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.js),[ts](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.ts),[svelte](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.svelte),[vue](https://github.com/graphql/graphiql/blob/main/packages/vscode-graphql-syntax/tests/__fixtures__/test.vue)) to learn our template tag, comment and other graphql delimiter patterns for the file types that the language server supports. The syntax highlighter currently supports more languages than the language server. If you notice any places where one or the other doesn't work, please report it!

## Known Issues

- the locally generated schema file for definition lookup currently does not re-generate on schema changes. this will be fixed soon.
- multi-root workspaces support will be added soon as well.
- some graphql-config options aren't always honored, this will also be fixed soon

## Attribution

Thanks to apollo for their
[graphql-vscode grammars](https://github.com/apollographql/vscode-graphql/blob/main/syntaxes/graphql.js.json)!
We have borrowed from these on several occasions. If you are looking for the
most replete set of vscode grammars for writing your own extension, look no
further!

## Development

This plugin uses the
[GraphQL language server](https://github.com/graphql/graphql-language-service-server)

1.  Clone the repository - https://github.com/graphql/graphiql
1.  `yarn`
1.  Run "VScode Extension" launcher in vscode
1.  This will open another VSCode instance with extension enabled
1.  Open a project with a graphql config file - ":electric_plug: graphql" in
    VSCode status bar indicates that the extension is in use
1.  Logs for GraphQL language service will appear in output section under
    GraphQL Language Service

### Contributing back to this project

This repository is managed by EasyCLA. Project participants must sign the free
([GraphQL Specification Membership agreement](https://preview-spec-membership.graphql.org))
before making a contribution. You only need to do this one time, and it can be
signed by
[individual contributors](http://individual-spec-membership.graphql.org/) or
their [employers](http://corporate-spec-membership.graphql.org/).

To initiate the signature process please open a PR against this repo. The
EasyCLA bot will block the merge if we still need a membership agreement from
you.

You can find
[detailed information here](https://github.com/graphql/graphql-wg/tree/main/membership).
If you have issues, please email
[operations@graphql.org](mailto:operations@graphql.org).

If your company benefits from GraphQL and you would like to provide essential
financial support for the systems and people that power our community, please
also consider membership in the
[GraphQL Foundation](https://foundation.graphql.org/join).

## License

MIT
