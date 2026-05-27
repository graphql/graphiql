---
'@graphiql/react': patch
'@graphiql/toolkit': patch
---

Add an in-memory `localStorage` polyfill to test setup files so that `StorageAPI` can construct in Node 24 + jsdom environments where `window` is defined but `localStorage` is not.
