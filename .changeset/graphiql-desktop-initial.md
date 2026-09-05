---
'graphiql-desktop': minor
---

Add `graphiql-desktop`, a standalone Electron GraphiQL app. GraphQL requests run in the main process instead of the renderer, so they aren't subject to browser CORS restrictions — point it at any GraphQL API. Unsigned installers for macOS (dmg/zip), Linux (AppImage/deb), and Windows (exe) are built in CI and attached to this package's GitHub release.
