---
'@graphiql/react': patch
---

Make `useGraphiQLSettings` the single writer of the `data-theme` attribute (scoped to the GraphiQL container) by dropping a redundant write to `<html>` from the theme store.
