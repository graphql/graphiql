---
'@graphiql/plugin-collections': minor
'graphiql': minor
---

Wire ⌘S / Ctrl+S (and the tab-strip Save button) to the collections plugin: if the current operation was opened from or previously saved to a collection, it is updated in place; otherwise the "Save to collection" dialog opens. Operations opened from a collection stay linked to their saved item.

The save and import/export dialogs are rebuilt on the shared `Dialog.Header`/`Body`/`Footer` chrome and the `Button` component so they match the rest of the v6 UI, and a couple of undefined design tokens (which left the dialog unstyled) are fixed.
