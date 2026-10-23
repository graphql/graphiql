---
'@graphiql/toolkit': patch
'@graphiql/react': patch
'graphiql': patch
---

Discover HTTP methods automatically when `createTransport` is called without `supportedMethods`. Previous RCs treated an omitted `supportedMethods` as `['POST']` and exposed a method chip and switcher in the top bar. The transport now sends an OPTIONS request without a body before its first HTTP operation, reads `Allow`, and automatically selects QUERY, then POST, then GET for queries. The top bar method controls are removed. The response pane instead shows the actual request method from the optional `TransportResponse.method` field alongside timing and size, including for HTTP error responses and incremental chunks. WebSocket events and custom transports without this metadata omit the method.

Discovery uses the effective request headers, is shared by concurrent requests, and runs again when headers change. If OPTIONS fails, times out after two seconds, or returns no usable `Allow` header, execution falls back to POST (or the configured `method` override). A valid advertisement containing no usable methods blocks HTTP execution. Mutations always require POST; GraphiQL delegates routing to the transport from Run, the operation dropdown, and the keyboard shortcut. An operation whose type cannot be determined also requires POST. If POST is unavailable, these operations fail without sending.

Pass `method: 'GET'` to override automatic query selection for testing. GET encodes queries, operation names, variables, and extensions in the URL without a body; mutations still require POST. An override that discovery excludes fails without silently choosing another method. `transport.setMethod?.('GET')` changes the override for subsequent queries, and `transport.setMethod?.()` restores automatic selection. Pass `supportedMethods: ['POST']` to preserve the previous POST-only default and skip OPTIONS, or use `method: 'GET', supportedMethods: ['GET', 'POST']` to test GET queries and POST mutations without discovery. If discovery fails with a configured GET override and no explicit capabilities, only GET is assumed available.

For cross-origin discovery, the server must permit OPTIONS and expose `Allow` through `Access-Control-Expose-Headers`. This discovers methods only, not QUERY request formats through `Accept-Query`, and does not retry operations with another method. Custom transports own routing and must prevent mutations over GET and QUERY. GraphiQL reads metadata from each response without subscribing to transport capability changes.
