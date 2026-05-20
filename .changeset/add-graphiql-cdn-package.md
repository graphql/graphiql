---
'@graphiql/cdn': major
---

Initial release. `@graphiql/cdn` is a pre-bundled CDN distribution of GraphiQL: a single ESM file (`dist/graphiql.js`) that loads in the browser from any static CDN with no build step, no importmap entries for transitive dependencies, and no third-party bundler in the request path. The package inlines `graphiql`, `@graphiql/react`, `@graphiql/plugin-explorer`, `@graphiql/toolkit`, and `graphql`; `react` and `react-dom` stay external. Monaco workers are emitted to `dist/workers/*` and loaded from the same origin as the bundle.
