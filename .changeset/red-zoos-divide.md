---
'graphiql': major
---

BREAKING: The following exports of the `graphiql` package have been removed:
- `DocExplorer`: Now exported from `@graphiql/react` as `DocExplorer`
  - The `schema` prop has been removed, the component now uses the schema provided by the `ExplorerContext`
- `fillLeafs`: Now exported from `@graphiql/toolkit` as `fillLeafs`
- `getSelectedOperationName`: Now exported from `@graphiql/toolkit` as `getSelectedOperationName`
- `mergeAst`: Now exported from `@graphiql/toolkit` as `mergeAst`
- `onHasCompletion`: Now exported from `@graphiql/react` as `onHasCompletion`
- `QueryEditor`: Now exported from `@graphiql/react` as `QueryEditor`
- `ToolbarMenu`: Now exported from `@graphiql/react` as `ToolbarMenu`
- `ToolbarMenuItem`: Now exported from `@graphiql/react` as `ToolbarMenu.Item`
- `ToolbarSelect`: Now exported from `@graphiql/react` as `ToolbarListbox`
- `ToolbarSelectOption`: Now exported from `@graphiql/react` as `ToolbarListbox.Option`
- `VariableEditor`: Now exported from `@graphiql/react` as `VariableEditor`
- type `Fetcher`: Now exported from `@graphiql/toolkit`
- type `FetcherOpts`: Now exported from `@graphiql/toolkit`
- type `FetcherParams`: Now exported from `@graphiql/toolkit`
- type `FetcherResult`: Now exported from `@graphiql/toolkit`
- type `FetcherReturnType`: Now exported from `@graphiql/toolkit`
- type `Observable`: Now exported from `@graphiql/toolkit`
- type `Storage`: Now exported from `@graphiql/toolkit`
- type `SyncFetcherResult`: Now exported from `@graphiql/toolkit`
