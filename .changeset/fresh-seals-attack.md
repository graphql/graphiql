---
'@graphiql/react': minor
---

BREAKING: Add a new context provider for plugins. This induces changes to the following other contexts and their provider components:
- The property `isVisible` and the methods `hide` and `show` of the `ExplorerContext` have been removed. Also, the property `isVisible` and the methods `hide`, `show` and `toggle` of the `HistoryContext` have been removed. Visibility state of plugins is now part of the `PluginContext` using the `visiblePlugin` property. The visibility state can be altered using the `setVisiblePlugin` method of the `PluginContext`.
- The `isVisible` prop of the `ExplorerContextProvider` has been removed. For controlling the visibility state of plugins you can now use the `visiblePlugin` prop of the `PluginContextProvider`.
- The `onToggle` prop of the `HistoryContextProvider` and the `onToggleVisibility` prop of the `ExplorerContextProvider` have been removed. For listening on visibility changes for any plugin you can now use the `onTogglePluginVisibility` prop of the `PluginContextProvider`.
