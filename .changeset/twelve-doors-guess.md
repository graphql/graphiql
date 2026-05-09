---
'@graphiql/react': patch
---

Bugfix for multiline selection highlight styling: disabling Monaco's `roundedSelection` option prevents selection highlight from appearing to extend beyond actual text selection. See issue [#4094](https://github.com/graphql/graphiql/issues/4094).
