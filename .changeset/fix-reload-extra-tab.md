---
'@graphiql/react': patch
---

Fix an extra empty tab being created on reload. The `query`/`variables`/`headers` storage keys are only written on edit, so reloading a session that never touched the editors found no stored editor state matching any tab and pushed a new empty one.
