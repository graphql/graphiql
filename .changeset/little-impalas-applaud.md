---
#'@graphiql/plugin-history': minor
#'@graphiql/toolkit': minor
#'@graphiql/react': minor
#'graphiql': minor
---

remove `createLocalStorage` from `@graphiql/toolkit`

deprecate `useStorage` and `useTheme` hooks, use `useGraphiQLActions` and `useGraphiQL` hooks instead.

remove `StorageAPI`, replace it with `persist` and `createJSONStorage` from `zustand/middleware`
