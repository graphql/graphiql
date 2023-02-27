---
'@graphiql/plugin-code-exporter': patch
'@graphiql/plugin-explorer': patch
---

avoid `useMemo` with empty array `[]` since React can't guarantee stable reference, + lint restrict syntax for future mistakes
