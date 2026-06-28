---
'@graphiql/react': minor
---

Restyle the editor tabs to the v6 design. Tabs now show a dirty-state dot when unsaved changes are present and a hover-only close affordance per tab. Adds a `lastSavedQuery` field to the tab store; the dirty state is computed from the diff against that snapshot. Adds a `saveQuery` action (keybind `Ctrl-S` / `Cmd-S`) that updates the snapshot. Adds prettify, copy, and save buttons to the right side of the tab strip.
