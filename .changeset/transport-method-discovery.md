---
'@graphiql/toolkit': patch
'@graphiql/react': patch
'graphiql': patch
---

Discover HTTP methods automatically when `createTransport` is called without `supportedMethods`. Previous RCs treated an omitted `supportedMethods` as `['POST']`. The transport now sends an OPTIONS request without a body before its first HTTP operation and uses the endpoint's `Allow` header to update the available GET, POST, and QUERY methods in GraphiQL. It preserves the selected method when supported; otherwise it selects POST, then QUERY, then GET.

Discovery uses the effective request headers, is shared by concurrent requests, and runs again when headers change. If OPTIONS fails, times out after two seconds, or returns no usable `Allow` header, execution uses the initial method (POST by default). A valid advertisement containing no usable methods blocks HTTP execution. Mutations still require POST. GraphiQL now delegates method routing to the transport: Run, the operation dropdown, and the keyboard shortcut can execute mutations while GET or QUERY is selected. The transport discovers capabilities with the current headers, sends the mutation via POST when available, or rejects it without sending. The selected query method stays unchanged.

Pass `supportedMethods: ['POST']` to preserve the previous default and skip OPTIONS, or supply another nonempty array to override discovery. For cross-origin discovery, the server must permit OPTIONS and expose `Allow` through `Access-Control-Expose-Headers`. This discovers methods only, not QUERY request formats through `Accept-Query`.

`Transport` now has an optional `subscribe(listener)` method that returns an unsubscribe function. GraphiQL uses notifications to update its method selector. Custom transports with static capabilities can omit `subscribe`. Custom transports own method routing and must prevent mutations over GET or QUERY.
