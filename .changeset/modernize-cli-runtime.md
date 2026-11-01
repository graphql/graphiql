---
'graphql-language-service-cli': patch
---

Stop loading the deprecated `@babel/polyfill` package. The CLI output targets ES2018 and runs on Node versions with native support for the required runtime features.
