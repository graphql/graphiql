---
'graphiql': patch
'@graphiql/create-fetcher': patch
---

Upgrades `meros` that now supports multiple payloads per chunk as an optimisation technique. This will now allow all
payloads within a chunk, to yield once, rather than yield once per payload. On the outset there is no tangible
difference other than paylaods would "render" at the same time, than in potentially different iterations.

This also introduces the ability to support a tri-state fetcher; giving the user the ability to yield a single payload
that is plain-old response, a multipart payload or an array of multipart payloads.

Thanks ~@maraisr in (#1783)
