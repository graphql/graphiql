---
'@graphiql/react': minor
---

Plugins now have access to `transport.onBeforeSend` and `transport.onResponse` hooks via `useGraphiQLPluginContext()`. Use `onBeforeSend` to inspect or transform outgoing requests; use `onResponse` to observe each response. Both return a cleanup function. The `transport` field on the context is `undefined` when the host uses the legacy `fetcher` prop; plugins should guard with optional chaining.
