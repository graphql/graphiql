---
'@graphiql/react': patch
---

Improve the error shown when the Variables or Headers pane contains invalid JSON. The message now uses plain language with a line and column (for example `expected a value at line 1, column 8`) instead of the bare `jsonc-parser` error code (`ValueExpected`), and is prefixed with `Request not sent.` so it is not mistaken for a server response.
