---
'@graphiql/plugin-collections': minor
---

New `@graphiql/plugin-collections` plugin: save named operations into folder collections and reuse them later.

- Collapsible tree UI with inline rename, hover-revealed row actions (edit, copy, delete), and QRY/MUT/SUB pills (a `MIX` pill when a saved document holds more than one operation).
- Save the current operation with ⌘S/Ctrl+S or the tab-strip Save button. An operation opened from a collection stays linked, so re-saving updates it in place instead of prompting; otherwise a "Save to collection" dialog opens. Clicking a saved item opens it in a new tab.
- Reorder within and across collections by drag-and-drop or keyboard: focus a row's drag handle, Space to grab, arrow keys to move (auto-expanding a collapsed destination), Space to drop, Escape to cancel.
- Copy/Share by clipboard: operation rows expose a raw-query **Copy** and an importable-envelope **Share**; collection headers expose **Share** only. Success is confirmed inline on the button (check icon for 1.5 s, screen-reader announcement), with no layout-shifting status text. Paste or drop a collections export anywhere in the pane to merge it in; import and export as JSON from the dialog.
- Identity-aware merge: imports reconcile by stable id, so re-importing updates in place and never duplicates. A conflict dialog lets you apply incoming changes, keep yours, or review each. Merge never deletes.
- Pluggable persistence via the `storage` option (defaults to `localStorage`), plus `readOnly`, `allowImportExport`, and `allowReplace` for locking down a governed deployment.
