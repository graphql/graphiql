---
'@graphiql/toolkit': patch
---

Use `subscriptionClient.iterate(request)` for transport subscriptions so stopping one disposes the underlying GraphQL SSE or WebSocket iterator, including while waiting for its next event. `graphql-sse` and `graphql-ws` v6 clients can be passed directly; custom subscription clients must implement `iterate`.
