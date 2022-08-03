---
'graphiql': major
---

BREAKING: The following exports of the `graphiql` package have been removed:
- `DocExplorer`: Now exported from `@graphiql/react` as `DocExplorer`
  - The `schema` prop has been removed, the component now uses the schema provided by the `ExplorerContext`
- `ToolbarMenu`: Now exported from `@graphiql/react` as `ToolbarMenu`
- `ToolbarMenuItem`: Now exported from `@graphiql/react` as `ToolbarMenu.Item`
- `ToolbarSelect`: Now exported from `@graphiql/react` as `ToolbarListbox`
- `ToolbarSelectOption`: Now exported from `@graphiql/react` as `ToolbarListbox.Option`
