---
'@graphiql/react': minor
'graphiql': minor
---

Make saving an operation a first-class capability so plugins can persist operations without the core depending on any specific plugin.

`@graphiql/react`:

- `registerSaveHandler(handler)` — register a save handler (returns an unregister function). ⌘S and the Save button fan out to every registered handler plus the `onSaveQuery` prop, and the dirty-state dot and Save affordance only appear when at least one is registered.
- `onSaveQuery(tab)` — prop invoked on save with the active tab; return `true` when the save commits synchronously. `markTabSaved(tabId)` clears the dot after a deferred save (e.g. a dialog) commits.
- `GraphiQLPlugin.sessionActions` — an always-mounted plugin slot (rendered regardless of pane visibility) for toolbar buttons, dialogs, or behavior registration such as a save handler.
- Keep a gap between a `Dialog.Header` title and its close button when the dialog is only as wide as its content.
- The dirty-state dot now means "a saved operation has unsaved edits" and survives a reload: `lastSavedQuery` is persisted, and a tab that was never saved reads clean instead of every restored tab showing dirty.

`graphiql`:

- Default-installs `@graphiql/plugin-collections`, so a Collections rail icon appears out of the box. Passing the `plugins` prop opts out of the default set as before.
- Wires ⌘S/Ctrl+S and the tab-strip Save button to the registered save handlers.
