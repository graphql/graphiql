---
'graphiql': patch
'@graphiql/react': patch
---

Move the logic for deriving operation facts from the current query to `@graphiql/react` and store these facts as properties on the query editor instance
