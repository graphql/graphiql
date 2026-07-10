---
'@graphiql/react': patch
'graphiql': patch
---

Fix the Monaco editors not recoloring when the theme is changed. Switching between Light, Dark, and Auto now updates the editors — background included — immediately, not just the surrounding UI.
