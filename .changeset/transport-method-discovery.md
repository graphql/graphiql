---
'@graphiql/toolkit': patch
'@graphiql/react': patch
'graphiql': patch
---

When `supportedMethods` is omitted, `createTransport` now discovers endpoint capabilities through `OPTIONS` and the `Allow` header instead of assuming POST only. Queries prefer QUERY, then POST, then GET. Mutations and operations of unknown type require POST. An explicit `method` override applies to queries and fails if discovery excludes it.

Discovery runs before the first HTTP operation, is shared by concurrent requests, and repeats when effective request headers change. If discovery fails, exceeds two seconds, or returns no usable `Allow` header, the transport falls back to POST (or the configured override). An explicit advertisement containing no usable methods blocks execution.

Pass `supportedMethods: ['POST']` to preserve the previous default and skip discovery, or list other known capabilities. Cross-origin servers must permit OPTIONS and expose `Allow` through `Access-Control-Expose-Headers`. See the request methods section of `docs/migration/graphiql-6.0.0.md` for configuration examples and fallback behavior.
