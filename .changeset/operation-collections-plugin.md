---
'@graphiql/plugin-collections': minor
---

New `@graphiql/plugin-collections` plugin: save named operations into folder collections and reuse them later.

- Collapsible tree UI with inline rename, per-row menus, and QRY/MUT/SUB pills (a `MIX` pill when a saved document holds more than one operation).
- Save the current operation with ⌘S/Ctrl+S or the tab-strip Save button. An operation opened from a collection stays linked, so re-saving updates it in place instead of prompting; otherwise a "Save to collection" dialog opens. Clicking a saved item opens it in a new tab.
- Reorder within and across collections by drag-and-drop, with a keyboard fallback in each row's menu.
- Share by clipboard: copy a whole collection or a single operation, then paste or drop it into the pane. Import and export as JSON from the dialog.
- Identity-aware merge: imports reconcile by stable id, so re-importing updates in place and never duplicates. A conflict dialog lets you apply incoming changes, keep yours, or review each. Merge never deletes.
- Pluggable persistence via the `storage` option (defaults to `localStorage`), plus `readOnly`, `allowImportExport`, `allowReplace`, and `allowCopy` for locking down a governed deployment.
