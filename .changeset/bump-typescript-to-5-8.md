---
'graphql-language-service-server': patch
---

Bump required TypeScript runtime dependency from `^5.3.3` to `^5.8.0`. This is preparatory work for adopting the TypeScript Native Preview (tsgo) compiler in a follow-up change, which tracks TypeScript 5.8 semantics. In practice `^5.3.3` already resolved to TS 5.8+ for most consumers; the new floor only affects consumers who pin TypeScript to 5.3–5.7 via resolutions or overrides.
