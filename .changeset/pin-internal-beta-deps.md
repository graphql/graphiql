---
'graphiql': patch
'@graphiql/react': patch
'@graphiql/plugin-collections': patch
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
'@graphiql/plugin-query-builder': patch
'@graphiql/plugin-code-exporter': patch
---

Pin internal `@graphiql/react` and `@graphiql/toolkit` dependency ranges to exact beta versions. The caret ranges (`^1.0.0-beta.0`) resolve to the `1.0.0-next.*` prereleases published in 2022 because semver sorts the `next` prerelease identifier above `beta`, so fresh installs of the beta pulled four-year-old packages.
