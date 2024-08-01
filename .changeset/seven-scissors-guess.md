---
'graphql-language-service-server': patch
---

- switch to using just @astrojs/compiler instead of the more complex "sync" adaptation using workers
- upgrade vue SFC parser to use the new reccomended import from vue package itself
- fix prettier config related to prettier & format on save for parseDocument tests
- fix jest/babel config related to some of the parsers
