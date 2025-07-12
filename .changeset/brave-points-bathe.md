---
'@graphiql/react': patch
'graphiql': patch
---

reduce bundle size, import `prettier` dynamically to avoid bundling Prettier

diff from vite example

```diff
-dist/assets/index-BMgFrxsd.js             4,911.53 kB │ gzip: 1,339.77 kB
+dist/assets/index-BlpzusGL.js             4,221.28 kB │ gzip: 1,145.58 kB
```
