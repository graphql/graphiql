---
'@graphiql/react': minor
---

Add a `transport` prop to `<GraphiQLProvider>` as a mutually-exclusive alternative to `fetcher`. When `transport` is supplied, the response pane surfaces the real HTTP wire metadata (status, headers, timing, size) directly from the underlying `Response`. When `fetcher` is supplied, the response pane shows a small dismissible banner pointing at the migration guide instead of fabricated values. `ExecutionSlice.lastResponse` is now typed as `TransportResponse | null`. Existing consumers using the `fetcher` prop continue to work unchanged. The `fetcher` prop is marked `@deprecated`.
