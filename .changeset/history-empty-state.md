---
'@graphiql/plugin-history': patch
---

Add an empty state to the History panel. Previously, with no run history and no favorites, the panel showed only its header with blank space below; it now shows a "No queries run yet." message, matching the empty-state treatment already used by the Collections panel.
