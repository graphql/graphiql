---
'graphiql': major
---

migrate from `webpack` to `vite`

changed exports

```diff
-graphiql/graphiql.css
+graphiql/style.css
```

changed cdn paths, `dist/index.umd.js` and `dist/style.css` are minified

```diff
-https://unpkg.com/graphiql/graphiql.js
-https://unpkg.com/graphiql/graphiql.min.js
+https://unpkg.com/graphiql/dist/index.umd.js
-https://unpkg.com/graphiql/graphiql.css
-https://unpkg.com/graphiql/graphiql.min.css
+https://unpkg.com/graphiql/dist/style.css
```
