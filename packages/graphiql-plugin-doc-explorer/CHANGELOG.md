# @graphiql/plugin-doc-explorer

## 0.0.1

### Patch Changes

- [#3916](https://github.com/graphql/graphiql/pull/3916) [`98d13a3`](https://github.com/graphql/graphiql/commit/98d13a3e515eb70aaf5a5ba669c680d5959fef67) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - remove the following exports from `@graphiql/react` and move them in `@graphiql/plugin-doc-explorer` package:

  - Argument
  - DefaultValue
  - DeprecationReason
  - Directive
  - DocExplorer
  - ExplorerContext
  - ExplorerContextProvider
  - ExplorerSection
  - FieldDocumentation
  - FieldLink
  - SchemaDocumentation
  - Search
  - TypeDocumentation
  - TypeLink
  - useExplorerContext
  - DOC_EXPLORER_PLUGIN
  - ExplorerContextType
  - ExplorerFieldDef
  - ExplorerNavStack
  - ExplorerNavStackItem
  - add new `referencePlugin` prop on `PluginContextProviderProps` component for plugin which is used to display the reference documentation when selecting a type.

- Updated dependencies [[`98d13a3`](https://github.com/graphql/graphiql/commit/98d13a3e515eb70aaf5a5ba669c680d5959fef67)]:
  - @graphiql/react@0.32.0
