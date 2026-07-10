---
'@graphiql/react': patch
---

Fix the Monaco editors not recoloring when the theme is changed. Switching between Light, Dark, and Auto now updates the query, variables, and response editors immediately, not just the surrounding UI.
