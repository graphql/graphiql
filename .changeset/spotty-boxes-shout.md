---
'graphiql': major
---

BREAKING: The following props of the `GraphiQL` component have been changed:
- The props `defaultVariableEditorOpen` and `defaultSecondaryEditorOpen` have been merged into one prop `defaultEditorToolsVisibility`. The default behavior if this prop is not passed is that the editor tools are shown if at least one of the secondary editors has contents. You can pass the following values to the prop:
  - Passing `false` hides the editor tools.
  - Passing `true` shows the editor tools.
  - Passing `"variables"` explicitly shows the variables editor.
  - Passing `"headers"` explicitly shows the headers editor.
- The props `docExplorerOpen`, `onToggleDocs` and `onToggleHistory` have been removed. They are replaced by the more generic props `visiblePlugin` (for controlling which plugin is visible) and `onTogglePluginVisibility` (which is called each time the visibility of any plugin changes).
- The `headerEditorEnabled` prop has been renamed to `isHeadersEditorEnabled`.
- The `ResultsTooltip` prop has been renamed to `responseTooltip`.
- Tabs are now always enabled. The `tabs` prop has therefore been replaced with a prop `onTabChange`. If you used the `tabs` prop before to pass this function you can change your implementation like so:
  ```diff
  <GraphiQL
  -  tabs={{ onTabChange: (tabState) => {/* do something */} }}
  +  onTabChange={(tabState) => {/* do something */}}
  />
  ```

