---
'@graphiql/react': patch
---

Pin internal prerelease dependencies, including the language service, Monaco integration, and plugins, to exact compatible beta versions. Fresh installs no longer select canary or older `next` packages through caret prerelease ranges. These temporary pins can return to normal ranges after stable packages are published.
