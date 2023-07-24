---
'@graphiql/react': patch
'graphiql': patch
---

Solves #2825, an old bug where new tabs were created on every refresh

the bug occurred when:

1. `shouldPersistHeaders` is not set to true
2. `headers` or `defaultHeaders` are provided as props
3. the user refreshes the browser
