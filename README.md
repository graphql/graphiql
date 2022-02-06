# VSCode GraphQL

GraphQL extension VSCode built with the aim to tightly integrate the GraphQL Ecosystem with VSCode for an awesome developer experience.

![](https://camo.githubusercontent.com/97dc1080d5e6883c4eec3eaa6b7d0f29802e6b4b/687474703a2f2f672e7265636f726469742e636f2f497379504655484e5a342e676966)

> 💡 **Note:** This extension no longer supports `.prisma` files. If you are using this extension with GraphQL 1, please rename your datamodel from `datamodel.prisma` to `datamodel.graphql` and this extension will pick that up.

## Features

Lots of new improvements happening! We now have a [`CHANGELOG.md`](https://github.com/graphql/vscode-graphql/blob/master/CHANGELOG.md#change-log)

### General features

- Load the extension on detecting `graphql-config file` at root level or in a parent level directory
- Load the extension in `.graphql`, `.gql files`
- Load the extension on detecting `gql` tag in js, ts, jsx, tsx, vue files
- Load the extension inside `gql`/`graphql` fenced code blocks in markdown files
- execute query/mutation/subscription operation, embedded or in graphql files
- pre-load schema and document defintitions
- Support [`graphql-config`](https://graphql-config.com/) files with one project and multiple projects
- the language service re-starts on changes to vscode settings and/or graphql config!

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

Install the [VSCode GraphQL Extension](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql).

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

the file needs to be placed at the project root by default, but you can configure paths per project. see the FAQ below for details.

Previous versions of this extension support `graphql-config@2` format, which follows [legacy configuration patterns](https://github.com/kamilkisiela/graphql-config/tree/legacy#usage)

If you need legacy support for `.graphqlconfig` files or older graphql-config formats, see [this FAQ answer](#legacy). If you are missing legacy `graphql-config` features, please consult [the `graphql-config` repository](https://github.com/kamilkisiela/graphql-config).

To support language features like "go-to definition" across multiple files, please include `documents` key in the `graphql-config` file default or per-project (this was `include` in 2.0).

## Configuration Examples

### Simple Example

```yaml
# .graphqlrc.yml
schema: "schema.graphql"
documents: "src/**/*.{graphql,js,ts,jsx,tsx}"
```

### Advanced Example

```js
// graphql.config.js
module.exports = {
  projects: {
    app: {
      schema: ["src/schema.graphql", "directives.graphql"],
      documents: ["**/*.{graphql,js,ts,jsx,tsx}", "my/fragments.graphql"],
      extensions: {
        endpoints: {
          default: {
            url: "http://localhost:8000",
            headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
          },
        },
      },
    },
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
        endpoints: {
          default: {
            url: "http://localhost:8080",
            headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
          },
        },
      },
    },
  },
}
```

Notice that `documents` key supports glob pattern and hence `["**/*.graphql"]` is also valid.

## Frequently Asked Questions

<span id="legacy" />

### I can't load `.graphqlconfig` files anymore

If you need to use a legacy config file, then you just need to enable legacy mode for `graphql-config`:

```
"graphql-config.load.legacy": true
```

### Go to definition is not working for my URL

You can try the new experimental `cacheSchemaFileForLookup` option. NOTE: this will disable all definition lookup for local SDL graphql schema files, and _only_ perform lookup of the result an SDL result of `graphql-config` `getSchema()`

To enable, add this to your settings:

```json
"vscode-graphql.cacheSchemaFileForLookup": true,
```

you can also use graphql config if you need to mix and match these settings:

```yml
schema: http://myschema.com/graphql
extensions:
  languageService:
    cacheSchemaFileForLookup: true
projects:
  project1:
    schema: project1/schema/schema.graphql
    documents: project1/queries/**/*.{graphql,tsx,jsx,ts,js}
    extensions:
      languageService:
      cacheSchemaFileForLookup: false

  project2:
    schema: https://api.spacex.land/graphql/
    documents: project2/queries.graphql
    extensions:
      endpoints:
        default:
          url: https://api.spacex.land/graphql/
      languageService:
        # Do project configs inherit parent config?
        cacheSchemaFileForLookup: true
```

### The extension fails with errors about duplicate types

Make sure that you aren't including schema files in the `documents` blob

### The extension fails with errors about missing scalars, directives, etc

Make sure that your `schema` pointers refer to a complete schema!

### In JSX and TSX files I see completion items I don't need

The way vscode lets you filter these out is [on the user end](https://github.com/microsoft/vscode/issues/45039)

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

### "Execute Query/Mutation/Subscription" always fails

The best way to make "execute <op type>" codelens work is to add endpoints config to the global graphql config or the project config.

This would look like:

```ts
export default {
  schema: "mschema.graphql",
  extension: {
    endpoints: {
      default: "http://localhost:9000",
    },
  },
}
```

(see above for per-project examples)

If there is an issue with execution that has to do with your server, the error response should show now in the result panel.

In case the request fails due to self signed certificate, you can bypass that check by adding this to your settings:

```json
"vscode-graphql.rejectUnauthorized": false
```

### My graphql config file is not at the root

Good news, we have configs for this now!

You can search a folder for any of the matching config file names listed above:

```json
"graphql-config.load.baseDir": "./config"
```

Or a specific filepath:

```json
"graphql-config.load.filePath": "./config/my-graphql-config.js"
```

Or a different `configName` that allows different formats:

```json
"graphql-config.load.baseDir": "./config",
"graphql-config.load.configName": "acme"
```

which would search for `./config/.acmerc`, `.config/.acmerc.js`, `.config/acme.config.json`, etc matching the config paths above

If you have multiple projects, you need to define one top-level config that defines all project configs using `projects`

### How do I highlight an embedded graphql string?

If you aren't using a template tag function such as `gql` or `graphql`, and just want to use a plain string, you can use an inline `#graphql` comment:

```ts
const myQuery = `#graphql
  query {
    something
  }
`
```

or


```ts
  const myQuery =
  /* GraphiQL / 
`
  query {
    something
  }
`
```
  
### Template literal expressions dont work with `Execute Query`

Experimental support for template literal expressions ala `${}` has been added for language support, which just add an empty newline behind the scenes. It does not yet work for `Execute Query` codelans.




## Known Issues

- the output channel occasionally shows "definition not found" when you first start the language service, but once the definition cache is built for each project, definition lookup will work. so if a "peek definition" fails when you first start the editor or when you first install the extension, just try the definition lookup again.

## Development

This plugin uses the [GraphQL language server](https://github.com/graphql/graphql-language-service-server)

1.  Clone the repository - https://github.com/graphql/vscode-graphql
1.  `npm install`
1.  Open it in VSCode
1.  Go to the debugging section and run the launch program "Extension"
1.  This will open another VSCode instance with extension enabled
1.  Open a project with a graphql config file - ":electric_plug: graphql" in VSCode status bar indicates that the extension is in use
1.  Logs for GraphQL language service will appear in output section under GraphQL Language Service
    ![GraphQL Language Service Logging](https://s3-ap-southeast-1.amazonaws.com/divyendusingh/vscode-graphql/Screen+Shot+2018-06-25+at+12.31.57+PM.png)

### Contributing back to this project

This repository is managed by EasyCLA. Project participants must sign the free ([GraphQL Specification Membership agreement](https://preview-spec-membership.graphql.org) before making a contribution. You only need to do this one time, and it can be signed by [individual contributors](http://individual-spec-membership.graphql.org/) or their [employers](http://corporate-spec-membership.graphql.org/).

To initiate the signature process please open a PR against this repo. The EasyCLA bot will block the merge if we still need a membership agreement from you.

You can find [detailed information here](https://github.com/graphql/graphql-wg/tree/main/membership). If you have issues, please email [operations@graphql.org](mailto:operations@graphql.org).

If your company benefits from GraphQL and you would like to provide essential financial support for the systems and people that power our community, please also consider membership in the [GraphQL Foundation](https://foundation.graphql.org/join).

## License

MIT
