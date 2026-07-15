---
'@graphiql/react': patch
'@graphiql/plugin-history': patch
'graphiql': patch
---

Tighten keyboard navigation: the settings dialog now restores focus to the gear button that opened it (Escape, the close button, and clicking outside all worked before but silently dropped focus to the page). History label edits can now be canceled with Escape and return focus to the row instead of the page.
