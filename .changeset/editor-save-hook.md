---
'@graphiql/react': minor
---

Add editor save hooks for hosts that persist operations (e.g. the collections plugin):

- `onSaveQuery(tab)` — invoked when the current operation is saved (Save button or ⌘S) with the active tab. Return `true` if the save committed synchronously so the dirty-state dot clears; return nothing to defer (e.g. a dialog opens).
- `markTabSaved(tabId)` — clears a tab's dirty-state dot after a deferred save commits.
