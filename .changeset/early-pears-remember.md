---
'@graphiql/toolkit': minor
'@graphiql/react': patch
---

`graphiql-toolkit` now accepts `HeadersInit` input.

`graphiql-react` has internal type changes to support this.

BREAKING CHANGE:

Because `graphiql-toolkit` functions now accept HeadersInit where previously a partially wider type of `Record<string, unknown>` was accepted, there is a technical backwards incompatibility. This new stricter type could for example cause your project to fail type checking after this upgrade. At runtime, nothing should change since if you weren't already using `string` typed value headers already then they were being coerced implicitly. In practice, this should only serve to marginally improve your code with trivial effort.
