---
'@graphiql/plugin-history': patch
'@graphiql/react': patch
'@graphiql/toolkit': patch
---

Show a `MethodPill` (`QRY`/`MUT`/`SUB`) on each History row in place of the green status dot. `QueryStoreItem` gains an optional `operation` field, populated at write time from the parsed query; legacy entries without it render with a new `ERR` pill variant. The Clear button no longer flashes green on success.
