---
'@graphiql/plugin-history': patch
'@graphiql/toolkit': patch
---

Show a `MethodPill` (`QRY`/`MUT`/`SUB`) on each History row in place of the green status dot. `QueryStoreItem` gains an optional `operation` field, populated at write time from the parsed query. The Clear button no longer flashes green on success.
