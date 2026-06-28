---
'@graphiql/toolkit': minor
---

`createTransport` now supports GET requests per the GraphQL over HTTP spec. Pass `method: 'GET'` and `supportedMethods: ['GET', 'POST']` to encode query parameters into the URL with no request body. Mutations always use POST regardless of the selected method, as required by the spec. `Transport` gains `url`, `method`, `supportedMethods`, and an optional `setMethod` for switching between methods at runtime. The low-level `simpleHttpTransport` and `multipartHttpTransport` primitives also accept an optional `method` argument for callers that need more control.
