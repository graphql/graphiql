# Change Log

All notable changes to the "vscode-graphql" extension will be manually documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

The git log should show a fairly clean view of each of these new versions, and the issues/PRs associated.

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
