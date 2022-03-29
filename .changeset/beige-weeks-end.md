---
'graphiql': patch
---

_security fix:_ replace the vulnerable `dset` dependency with `set-value`

`dset` is vulnerable to prototype pollution attacks. this is only possible if you are doing all of the following:

1. running graphiql with an experimental graphql-js release tag that supports @stream and @defer
2. executing a properly @streamed or @deferred query ala IncrementalDelivery spec, with multipart chunks
3. consuming a malicious schema that contains field names like proto, prototype, or constructor that return malicious data designed to exploit a prototype pollution attack
