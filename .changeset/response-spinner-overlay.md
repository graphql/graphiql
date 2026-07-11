---
'graphiql': patch
'@graphiql/react': patch
---

Render the response loading spinner as an overlay instead of a layout sibling, so it no longer shifts the response header and result view down while a query is running. Also restyled it smaller and tokenized to match the response header.
