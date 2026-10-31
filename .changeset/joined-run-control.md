---
'@graphiql/react': patch
'@graphiql/toolkit': patch
'graphiql': patch
---

Join Run, the selected operation name, and the request method in one control. Choosing an operation now selects it without executing it; press Run or use the keyboard shortcut to execute. Query methods can follow automatic selection or use an explicit supported method. Mutations show POST without clearing the query preference, and subscriptions omit the HTTP method control.

Add optional `Transport.methodOverride` and `Transport.subscribe` APIs so method controls update after capability discovery and external method changes. Custom transports without these APIs remain supported.
