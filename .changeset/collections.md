---
'@graphiql/plugin-collections': minor
'@graphiql/react': minor
'graphiql': minor
---

New `@graphiql/plugin-collections` plugin for saving named operations into folder collections and reusing them later, default-installed in the `graphiql` meta-package so a Collections rail icon appears out of the box (passing the `plugins` prop opts out of the default set as before).

- Collapsible tree UI with inline rename, hover-revealed row actions, and QRY/MUT/SUB pills (a `MIX` pill when a saved document holds more than one operation).
- Save the current operation with ⌘S/Ctrl+S or the tab-strip Save button. An operation opened from a collection stays linked, so re-saving updates it in place; otherwise a "Save to collection" dialog opens. Clicking a saved item opens it in a new tab.
- Reorder within and across collections by drag-and-drop or keyboard (focus a row's drag handle, Space to grab, arrow keys to move, Space to drop, Escape to cancel).
- Copy a raw query or Share an importable envelope from any row; collection headers expose Share. Paste or drop a collections export anywhere in the pane to merge it in, or import/export JSON from the dialog. Imports reconcile by stable id, so re-importing updates in place and never duplicates; a conflict dialog lets you apply incoming changes, keep yours, or review each, and merge never deletes.
- Pluggable persistence via the `storage` option (defaults to `localStorage`), plus `readOnly`, `allowImportExport`, and `allowReplace` for governed deployments.

To support this without the core depending on any specific plugin, `@graphiql/react` gains a save API: `registerSaveHandler(handler)` (⌘S and the Save button fan out to every registered handler plus the `onSaveQuery` prop, and the dirty-state affordance only appears when at least one is registered), the `onSaveQuery(tab)` prop with `markTabSaved(tabId)` for deferred saves, and `GraphiQLPlugin.sessionActions`, an always-mounted plugin slot for toolbar buttons, dialogs, or behavior registration. The dirty-state dot now means "a saved operation has unsaved edits" and survives a reload, so a tab that was never saved reads clean.
