---
'graphql-language-service-server': patch
---

Run only one cache initialization at a time while the server starts. File events that arrive before initialization finishes now wait for the in-flight run instead of starting another one, which replaced the cache several times and made go-to-definition unreliable until the last run finished.
