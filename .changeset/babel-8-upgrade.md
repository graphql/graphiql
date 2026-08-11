---
'graphql-language-service-server': patch
'graphql-language-service-cli': patch
---

`graphql-language-service-server` now parses source files with `@babel/parser` v8; the `graphql-language-service-cli` binary no longer loads `@babel/polyfill` at startup.
