---
'monaco-graphql': patch
---

prevent the mode from instantiating more than once in the main process. it should never need to! 

you can supply multiple `schemas` with uri path resolution rules that resolve globs in the browser even!
