---
'graphiql': minor
---

Add a `transport` prop to `<GraphiQL>`, mutually exclusive with `fetcher` at the type level. The response pane header now shows the real HTTP status, total time, and response size when a `Transport` is in use. When the deprecated `fetcher` prop is used, the response pane shows a one-time dismissible banner pointing at `docs/migration/graphiql-6.0.0.md`. `GraphiQL.createTransport` is exposed on the CDN bundle. Examples and README snippets migrate to `createTransport` + `transport`. The `fetcher` prop continues to work but is deprecated.
