---
'@graphiql/react': minor
---

Add shared dialog chrome to the `Dialog` compound component: `Dialog.Header` (title + close button with a divider), `Dialog.Body` (padded content region), and `Dialog.Footer` (right-aligned action row). The settings dialog now uses `Dialog.Header`, and plugins can build consistent dialogs without re-implementing the layout.

Add an `onSaveQuery` editor callback, invoked when the current operation is saved (Save button or ⌘S) with the active tab. Mirrors `onCopyQuery`; the built-in dirty-state tracking is unchanged.
