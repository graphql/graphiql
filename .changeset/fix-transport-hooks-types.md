---
'@graphiql/react': patch
---

Fix `@graphiql/react` type error: the transport hooks `wrap()` and its test mocks now satisfy the stricter `Transport` type (which requires `url`, `method`, and `supportedMethods`).
