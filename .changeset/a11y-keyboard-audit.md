---
'@graphiql/react': patch
'@graphiql/plugin-history': patch
'graphiql': patch
---

History label edits can now be canceled with Escape, and focus returns to the row's edit button instead of dropping to the page. `Dialog` gains an optional `restoreFocusRef` prop for returning focus to a specific element on close.
