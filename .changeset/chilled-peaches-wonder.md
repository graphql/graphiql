---
'@graphiql/react': minor
'monaco-graphql': patch
'graphql-language-service': minor
'graphiql': minor
---

feat(graphql-language-service): export `getContextAtPosition`
feat(graphiql): dynamically import `monaco-editor` and `monaco-graphql`

When using GraphiQL in Next.js app, you no longer need to use `next/dynamic`:

```diff
-import dynamic from 'next/dynamic'
-const GraphiQL = dynamic(() => import('graphiql').then(mod => mod.GraphiQL), {
-  ssr: false
-})
+import { GraphiQL } from 'graphiql'
```
