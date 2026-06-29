---
'@graphiql/plugin-collections': minor
---

Frictionless import in the Operation Collections pane: drop a collections-export `.json` file onto the pane, or paste an export (⌘V/Ctrl+V) while it's open, to merge it in. Paste is guarded so it never hijacks a normal paste — it only acts when you're not typing in an editor and the clipboard actually holds an export.
