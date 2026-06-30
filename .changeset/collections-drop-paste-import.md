---
'@graphiql/plugin-collections': minor
---

Frictionless sharing for the Operation Collections pane:

- **Import** — drop a collections-export `.json` onto the pane, or paste an export (⌘V/Ctrl+V) while it's open, to merge it in. Paste is guarded so it never hijacks a normal paste — it only acts when you're not typing in an editor and the clipboard actually holds an export.
- **Export** — "Copy to clipboard" on a collection's menu copies that collection as an export, and the Import/Export dialog gains a "Copy JSON" button for all collections. Together with paste-import, a teammate can copy a collection and you paste it straight into your pane.
