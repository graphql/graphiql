---
'@graphiql/plugin-doc-explorer': minor
'@graphiql/plugin-history': minor
'@graphiql/react': minor
'graphiql': minor
---

- deprecate `useExplorerContext`, `useHistoryContext`, `usePrettifyEditors`, `useCopyQuery`, `useMergeQuery`, `useExecutionContext`, `usePluginContext`, `useSchemaContext`, `useStorageContext` hooks
- fix response editor overflow on `<GraphiQL.Footer />`
- export `GraphiQLProps` type
- allow `children: ReactNode` for `<GraphiQL.Toolbar />`
- change `ToolbarMenu` component:
  - The `label` and `className` props were removed
  - The `button` prop should now be a button element
- document `useGraphiQL` and `useGraphiQLActions` hooks in `@graphiql/react` README.md
- rename `useThemeStore` to `useTheme`
