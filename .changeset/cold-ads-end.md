---
'@graphiql/plugin-history': patch
'@graphiql/react': patch
'graphiql': patch
---

Ensure `storage` and `theme` store values aren't shared between GraphiQL instances. Deprecate `useTheme` and `useStorage` hooks in favour of values from `useGraphiQL` and `useGraphiQLActions` hooks
