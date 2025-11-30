---
"monaco-graphql": patch
---

to fix esm.sh example we should pin `monaco-editor` peer dependency to versions `≥ 0.20.0 and < 0.52.2`, since `monaco-editor@^0.53.0` isn't supported yet with `monaco-graphql`
