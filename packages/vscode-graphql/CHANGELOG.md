# Change Log

## 0.3.52

### Patch Changes

- [#452](https://github.com/graphql/vscode-graphql/pull/452) [`8878e42`](https://github.com/graphql/vscode-graphql/commit/8878e428c83eed4f53510f9071e9964f48b5d214) Thanks [@acao](https://github.com/acao)! - Limit activation events for package.json file provided `graphql-config`

## 0.3.50

### Patch Changes

- [#448](https://github.com/graphql/vscode-graphql/pull/448) [`f894dad`](https://github.com/graphql/vscode-graphql/commit/f894daddfe7382f7eb8e9c921c54904255a3557c) Thanks [@acao](https://github.com/acao)! - ugprade graphql-language-service-server to the latest patch version for windows path fix

* [#436](https://github.com/graphql/vscode-graphql/pull/436) [`2370607`](https://github.com/graphql/vscode-graphql/commit/23706071c6338c05e951783a3e7dfd5000da6d02) Thanks [@orta](https://github.com/orta)! - Adds support for making clicking on the graphql status item show the output channel

- [#277](https://github.com/graphql/vscode-graphql/pull/277) [`6017872`](https://github.com/graphql/vscode-graphql/commit/6017872b7f19ef5c3fcad404fca9ffd5b8ba5d87) Thanks [@AumyF](https://github.com/AumyF)! - provide 'Execute Query' for `/* GraphQL */` templates

* [#422](https://github.com/graphql/vscode-graphql/pull/422) [`0e2235d`](https://github.com/graphql/vscode-graphql/commit/0e2235d7fa229b78fb330c337d14fabf679884c2) Thanks [@orta](https://github.com/orta)! - Use the vscode theme API to set the right colours for the status bar item

## 0.3.48

### Patch Changes

- [#402](https://github.com/graphql/vscode-graphql/pull/402) [`a97e5df`](https://github.com/graphql/vscode-graphql/commit/a97e5df9933dfc79b06e5202c84216cfe2d5f865) Thanks [@acao](https://github.com/acao)! - thanks @markusjwetzel! Add directive highlighting for type system directives. [https://github.com/graphql/vscode-graphql/pull/326](https://github.com/graphql/vscode-graphql/pull/326)

## 0.3.43

### Patch Changes

- [#391](https://github.com/graphql/vscode-graphql/pull/391) [`6be5593`](https://github.com/graphql/vscode-graphql/commit/6be5593a45a4629f3438f59223ecb04949cb48d2) Thanks [@acao](https://github.com/acao)! - LSP upgrades:

  - bugfix for `insertText` & completion on invalid list types
  - add support for template strings and tags with replacement expressions, so strings like these should work now:

  ```ts
  const = /*GraphiQL*/
      `
          ${myFragments}
          query MyQuery {
              something
              ${anotherString}
          }

      `
  ```

  ```ts
  const = gql`
          ${myFragments}
          query MyQuery {
              something
              ${anotherString}
          }

      `
  ```

All notable changes to the "vscode-graphql" extension will be manually documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

The git log should show a fairly clean view of each of these new versions, and the issues/PRs associated.

# 0.3.25

Remove `node_modules` from bundle after adding `esbuild` to make the extension bundle smaller

# 0.3.24

Add highlighting and langauge support for `.mjs`, `.cjs`, `.es6`, `.esm` and other similar extensions

# 0.3.23

Major bugfixes for language features. Most bugs with language features not working should be resolved.

The `useSchemaFileDefinition` setting was deprecated, and SDL-driven projects work by default. If you want to opt-into an experimental feature to cache graphql-config schema result for definitions (useful for remote schemas), consult the readme on how to configure `cacheSchemaFileForLookup` option in vscode settings, or graphql config (yes you can enable/disable it per-project!)

Definition lookup works by default with SDL file schemas. `cacheSchemaFileForLookup` must be enabled if you have a remote schema want definition lookup for input types, etc in queries

# 0.3.19

- support `graphql-config` for `.ts` and `.toml` files by upgrading `graphql-config` & `graphql-language-service-server`
- use `*` activation event, because `graphql-config` in `package.json` is impossible to detect otherwise using vscode `activationEvents`
- support additional language features in `graphql-language-service-server` such as interface implements interfaces, etc
- upgrade operation execution to use a new graphql client and support subscriptions
- fix openvsx & vscode publish by re-creating PATs and signing new agreements

Note: there are still some known bugs in the language server we will be fixing soon:

- if you don't see editor output, please check your config
- output channel may show errors even after your configuration works
- there may be issues with schema file loading

# 0.3.13

LSP bugfixes:

- [streaming interface bug](https://github.com/graphql/graphiql/blob/main/packages/graphql-language-service-server/CHANGELOG.md#256-2020-11-28)
- bugfixes for windows filepaths in LSP server

# 0.3.8

- require `dotenv` in the server runtime (for loading graphql config values), and allow a `graphql-config.dotEnvPath` configuration to specify specific paths
- reload server on workspace configuration changes
- reload severside `graphql-config` and language service on config file changes. definitions cache/etc will be rebuilt
  - note: client not configured to reload on graphql config changes yet (i.e endpoints)
- accept all `graphql-config.loadConfig()` options

# 0.3.7

- update underlying `graphql-language-service-server` to allow .gql, .graphqls extensions

# 0.3.6

- documentation fix

# 0.3.5

- readme documentation improvements, more examples, FAQ, known issues
- bump `graphql-language-service-server` to allow implicit fragment completion (non-inline fragments). just include your fragments file or string in the graphql-config `documents`

# 0.3.4

- remove insiders announcement until tooling is properly in place, and insiders extension is up to date

# 0.3.3

- `useSchemaFileDefinition` setting

# 0.3.2

- #213: bugfix for input validation on operation exection

# 0.3.1 🎉

- upgrade to `graphql-config@3`
- upgrade to latest major version of `graphql-language-service-server`
  - upgrades `graphql-config@3`
  - remove watchman dependency 🎉
  - introduce workspace symbol lookup, outline
  - validation and completion for input variables
  - generate a schema output by default, for code-first schemas. SDL first schemas have an override option now

## Historical 0.2.x versions

[todo]
