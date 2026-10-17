---
'graphql-language-service-server': patch
---

Pass the project through when caching schema files, so their object types are indexed under the project that declared them. Previously the project was looked up again by file path, which could pick the first project in a multi-project config or fail with `doesn't match any project`.
