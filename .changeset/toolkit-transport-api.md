---
'@graphiql/toolkit': minor
---

Add a new `Transport` API alongside the existing `Fetcher`. `createTransport({...})` produces a `Transport` exposing structured request/response data — URL, method, headers, status, timing, size, resolver traces — for downstream UI features that need to inspect or modify the wire format.
