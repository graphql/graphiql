---
'@graphiql/plugin-collections': major
'@graphiql/react': minor
'graphiql': minor
---

pr: 4359

Add `@graphiql/plugin-collections` for saving operations in named collections, reopening them in tabs, and sharing or importing collections as JSON. Save with Cmd+S/Ctrl+S or the Save button. Re-saving an operation opened from a collection updates that saved item. Imports match items by stable ID and offer conflict resolution; merging preserves existing items.

Use `COLLECTIONS_PLUGIN` for the default configuration, or `collectionsPlugin(options)` to configure a storage adapter, `readOnly`, `allowImportExport`, and `allowReplace`. The default adapter uses `localStorage`.

`@graphiql/react` adds `registerSaveHandler(handler)` to connect a plugin to the save shortcut and button. Only one handler can be registered at a time. GraphiQL waits for its promise to resolve before marking the submitted query snapshot saved; cancellation and errors leave it unsaved. `GraphiQLPlugin.sessionActions` provides an always-mounted slot for plugin actions, dialogs, and behavior registration.
