---
'graphql-language-service-server': patch
---

Bind the `textDocument/didClose` handler to the message processor. It was passed as an unbound method, so every file close failed with `Cannot read properties of undefined (reading '_isInitialized')` and closed documents were never removed from the cache.
