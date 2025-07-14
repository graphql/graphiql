---
'@graphiql/react': patch
'monaco-graphql': patch
'graphql-language-service': minor
'graphiql': minor
---

feat(graphql-language-service): export `getContextAtPosition`
feat(graphiql): dynamically import `monaco-editor` and `monaco-graphql`

You no longer need to import GraphiQL with `next/dynamic` in Next.js app.

```diff
-import dynamic from 'next/dynamic'
-const GraphiQL = dynamic(() => import('graphiql').then(mod => mod.GraphiQL), {
-  ssr: false
-})
+import { GraphiQL } from 'graphiql'
```
