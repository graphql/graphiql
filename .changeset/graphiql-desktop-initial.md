---
'graphiql-desktop': minor
---

Add `graphiql-desktop`, a standalone Electron GraphiQL app. GraphQL requests run in the main process instead of the renderer, so they aren't subject to browser CORS restrictions — point it at any GraphQL API. Packaged binaries aren't published yet; this adds the app itself and its unit tests.
