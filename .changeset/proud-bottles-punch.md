---
'@graphiql/react': patch
'graphiql': patch
---

- use `allowTrailingComma` option in jsonc parser to make `tryParseJsonObject` sync
- parse introspection headers with jsonc parser
- use prettier format for query editor since we already use prettier for jsonc editors
