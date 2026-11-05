---
'graphql-language-service-server': patch
---

Skip JS/TS and other embedded files that don't match a project's `documents`, `schema` or `include` instead of validating them against the fallback project
