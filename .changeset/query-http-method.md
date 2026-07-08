---
'@graphiql/toolkit': minor
'@graphiql/react': minor
---

Add support for the HTTP `QUERY` method. `createTransport` now accepts `'QUERY'` in `method` / `supportedMethods`; a `QUERY` request sends a JSON body like `POST` but is safe and idempotent like `GET` (per the [HTTP QUERY method](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/)). Because `QUERY` is a safe method, mutations sent over it are transparently upgraded to `POST` (or blocked in the UI when `POST` is unavailable), the same as `GET`. The top-bar method chip now cycles through all supported methods instead of toggling between two.
