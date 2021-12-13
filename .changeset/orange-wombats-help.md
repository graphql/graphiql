---
'monaco-graphql': patch
---

fix: monaco `getModeId` bug for `monaco-editor@^0.30.0`

We fixed this already, but we reverted it because folks were having issues with older versions. This fix works for all versions of `monaco-editor` that we support!